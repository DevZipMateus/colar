
import React from 'react';

const HelpText = () => {
  return (
    <div className="mt-3 text-xs text-gray-500">
      <p className="mb-1">💡 <strong>Dicas:</strong></p>
      <ul className="space-y-1 text-xs">
        <li>• Confirme seu email se ainda não confirmou</li>
        <li>• Use a mesma conta que recebeu o convite</li>
        <li>• Códigos são válidos por tempo limitado</li>
        <li>• Se você criou o grupo, não precisa de convite</li>
      </ul>
    </div>
  );
};

export default HelpText;
