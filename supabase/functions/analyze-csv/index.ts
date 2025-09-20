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
    const OLLAMA_API_BASE = Deno.env.get('OLLAMA_API_BASE');
    const OLLAMA_MODEL = Deno.env.get('OLLAMA_MODEL');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    const { csvContent, analysisType = 'structure' } = await req.json();
    
    if (!csvContent) {
      throw new Error('CSV content is required');
    }

    console.log('Analyzing CSV with type:', analysisType);

    // Função para criar prompts otimizados para Mistral
    const createPromptForMistral = (analysisType: string, csvContent: string): string => {
      const systemContext = "Você é um especialista em análise de dados financeiros e CSVs brasileiros. Sempre responda em português brasileiro de forma clara e estruturada.";
      
      let userPrompt = '';
      
      if (analysisType === 'structure') {
        userPrompt = `${systemContext}

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
        userPrompt = `${systemContext}

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
        userPrompt = `${systemContext}

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
        userPrompt = `${systemContext}

Analise este CSV de controle financeiro exportado de uma planilha brasileira e extraia as seções de forma estruturada.

CSV:
${csvContent}

TAREFAS:
1. Identifique e separe as seções:
   - Total de Gastos e Saldo (valores como "Total de Gastos: R$ 2.293,17", "Saldo: -R$ 293,17")
   - Gastos Fixos e Gastos do Mês
   - Categorias das colunas P3:P18 (Mercado, Despesas eventuais, Necessidades, Roupas, Saúde, Presentes, Beleza, Educação, Lazer, Eletrônicos, Assinaturas, 99/Transporte, IFood/Restaurante, Aluguel, Contas)
   - Cartões de crédito e seus totais (Nubank, Magalu, Renner, Carrefour, Banrisul, etc.)

2. Extraia informações dos cartões:
   - Nome do cartão e total gasto
   - Transações individuais com parcelas se disponível
   - Categorias dos gastos por cartão

3. Limpe os valores numéricos:
   - Converta "R$ 2.293,17" em 2293.17
   - Converta "-R$ 293,17" em -293.17
   - Ignore células vazias ou "#ERROR!"
   - Trate pontos como separadores de milhares e vírgulas como decimais

4. RESPONDA APENAS COM UM JSON VÁLIDO neste formato exato:
{
  "totais": {
    "total_gastos": número ou null,
    "saldo": número ou null,
    "total_fixos": número ou null,
    "total_gastos_mes": número ou null,
    "total_cartao": número ou null
  },
  "categorias": [
    {"nome": "string", "valor_esperado": número ou null, "valor_gasto": número ou null, "porcentagem": número ou null}
  ],
  "cartoes": [
    {
      "nome": "string",
      "total": número,
      "transacoes": [
        {"descricao": "string", "valor": número, "parcelas": "string ou null", "categoria": "string ou null", "data": "string ou null"}
      ]
    }
  ],
  "analises": {
    "saldo_status": "positivo/negativo/neutro",
    "categorias_estouradas": ["nome das categorias que estouraram"],
    "maior_gasto": "nome da categoria com maior gasto",
    "percentual_usado_orcamento": número ou null,
    "cartao_mais_usado": "nome do cartão com maior gasto",
    "alertas": ["lista de alertas importantes"]
  }
}

NÃO inclua texto adicional, apenas o JSON válido.`;
      }
      
      return userPrompt;
    };

    // Função para tentar análise com Ollama
    const tryOllamaAnalysis = async (prompt: string): Promise<string> => {
      if (!OLLAMA_API_BASE || !OLLAMA_MODEL) {
        throw new Error('Ollama not configured');
      }

      console.log('Tentando análise com Ollama/Mistral...');
      
      const ollamaResponse = await fetch(`${OLLAMA_API_BASE}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
        }),
      });

      if (!ollamaResponse.ok) {
        const errorText = await ollamaResponse.text();
        console.error('Ollama API error:', errorText);
        throw new Error(`Ollama API error: ${ollamaResponse.status}`);
      }

      const ollamaData = await ollamaResponse.json();
      
      if (!ollamaData.response) {
        throw new Error('Invalid Ollama response format');
      }

      console.log('Análise Ollama/Mistral concluída com sucesso');
      return ollamaData.response;
    };

    // Função de fallback para OpenAI
    const tryOpenAIAnalysis = async (prompt: string): Promise<string> => {
      if (!OPENAI_API_KEY) {
        throw new Error('OpenAI API key not available for fallback');
      }

      console.log('Usando fallback OpenAI...');
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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

      if (!openaiResponse.ok) {
        const errorData = await openaiResponse.text();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData = await openaiResponse.json();
      console.log('Análise OpenAI (fallback) concluída com sucesso');
      return openaiData.choices[0].message.content;
    };

    // Preparar prompt otimizado
    const prompt = createPromptForMistral(analysisType, csvContent);
    let analysis: string;
    let usedProvider = 'unknown';

    // Tentar Ollama primeiro, fallback para OpenAI se falhar
    try {
      analysis = await tryOllamaAnalysis(prompt);
      usedProvider = 'ollama';
    } catch (ollamaError) {
      console.warn('Ollama falhou, tentando OpenAI:', ollamaError.message);
      try {
        analysis = await tryOpenAIAnalysis(prompt);
        usedProvider = 'openai';
      } catch (openaiError) {
        console.error('Ambas as APIs falharam:', { ollamaError: ollamaError.message, openaiError: openaiError.message });
        throw new Error(`Análise falhou: Ollama (${ollamaError.message}) e OpenAI (${openaiError.message})`);
      }
    }

    console.log(`Analysis completed successfully using ${usedProvider}`);

    return new Response(JSON.stringify({ 
      analysis,
      analysisType,
      success: true,
      provider: usedProvider
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