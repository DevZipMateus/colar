import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }

    const { csvContent, analysisType = 'structure' } = await req.json();
    
    if (!csvContent) {
      throw new Error('CSV content is required');
    }

    console.log('Analyzing CSV with type:', analysisType);

    let prompt = '';
    
    if (analysisType === 'structure') {
      prompt = `
Analise a estrutura deste CSV e responda em português:

CSV:
${csvContent}

Por favor, forneça:
1. Encoding detectado
2. Delimitador usado
3. Cabeçalhos encontrados
4. Tipos de dados em cada coluna
5. Quantidade de registros
6. Possíveis problemas de formatação
7. Sugestões de mapeamento para campos financeiros (descrição, valor, data, categoria, etc)

Responda em formato JSON estruturado.`;
    } else if (analysisType === 'validation') {
      prompt = `
Valide este CSV financeiro e identifique problemas em português:

CSV:
${csvContent}

Verifique:
1. Datas em formatos inválidos
2. Valores monetários mal formatados
3. Campos obrigatórios vazios
4. Inconsistências nos dados
5. Duplicatas potenciais
6. Sugestões de correção

Responda em formato JSON com lista de problemas encontrados.`;
    } else if (analysisType === 'insights') {
      prompt = `
Gere insights financeiros deste CSV em português:

CSV:
${csvContent}

Forneça análises sobre:
1. Principais categorias de gastos
2. Padrões de consumo
3. Valores médios por categoria
4. Tendências temporais se houver datas
5. Sugestões de categorização
6. Alertas sobre gastos altos

Responda em português de forma clara e estruturada.`;
    } else if (analysisType === 'financial-overview') {
      prompt = `
Você é um especialista em análise de planilhas financeiras brasileiras. Analise este CSV de controle financeiro exportado de uma planilha e extraia as seções de forma estruturada.

CSV:
${csvContent}

TAREFAS:
1. Identifique e separe as seções:
   - Total de Gastos e Saldo (valores como "Total de Gastos: R$ 2.293,17", "Saldo: -R$ 293,17")
   - Gastos Fixos e Gastos do Mês
   - Tabela de Categorias (com colunas: Categoria, Valor esperado, Valor gasto, Porcentagem)

2. Limpe os valores numéricos:
   - Converta "R$ 2.293,17" em 2293.17
   - Converta "-R$ 293,17" em -293.17
   - Ignore células vazias ou "#ERROR!"
   - Trate pontos como separadores de milhares e vírgulas como decimais

3. RESPONDA APENAS COM UM JSON VÁLIDO neste formato exato:
{
  "totais": {
    "total_gastos": número ou null,
    "saldo": número ou null,
    "total_fixos": número ou null,
    "total_gastos_mes": número ou null
  },
  "categorias": [
    {"nome": "string", "valor_esperado": número ou null, "valor_gasto": número ou null, "porcentagem": número ou null}
  ],
  "analises": {
    "saldo_status": "positivo/negativo/neutro",
    "categorias_estouradas": ["nome das categorias que estouraram"],
    "maior_gasto": "nome da categoria com maior gasto",
    "percentual_usado_orcamento": número ou null
  }
}

NÃO inclua texto adicional, apenas o JSON válido.`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Você é um especialista em análise de dados financeiros e CSVs. Sempre responda em português brasileiro de forma clara e estruturada.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    console.log('Analysis completed successfully');

    return new Response(JSON.stringify({ 
      analysis,
      analysisType,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-csv function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});