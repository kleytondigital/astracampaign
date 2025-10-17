import React from 'react';

// Componente de teste para verificar se o problema está na estrutura do menu
const TestNavigation: React.FC = () => {
  const testMenuItems = [
    {
      type: 'item',
      path: '/test',
      label: 'Test Item',
      icon: <span>📝</span>
    },
    {
      type: 'group',
      label: 'Test Group',
      icon: <span>📁</span>,
      items: [
        {
          path: '/test-sub',
          label: 'Test Sub',
          icon: <span>📄</span>
        }
      ]
    }
  ];

  console.log('🧪 Test Navigation:', testMenuItems);

  return (
    <div className="bg-white p-4 m-4 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Test Navigation</h2>
      <div className="space-y-2">
        {testMenuItems.map((item, index) => (
          <div key={index} className="p-2 border rounded">
            <div className="font-medium">{item.label}</div>
            <div className="text-sm text-gray-600">Type: {item.type}</div>
            {item.items && (
              <div className="text-sm text-gray-500">
                Subitems: {item.items.length}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestNavigation;
