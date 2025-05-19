import { useTheme } from '../ThemeContext';

export default function BlockPalette({ blocks, categories, handleDragStart }) {
  const { theme } = useTheme();
  
  return (
    <div className={`w-64 ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-900'} p-4 flex-shrink-0 overflow-y-auto`}>
      <h2 className="font-bold mb-2">Chaincode Blocks</h2>
      
      {categories.map(category => (
        <div key={category.id} className="mb-4">
          <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>{category.name}</h3>
          <div className="space-y-2">
            {blocks
              .filter(block => block.category === category.id)
              .map(block => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, block.id)}
                  className={`${block.color} text-white p-2 rounded cursor-move shadow-sm`}
                >
                  {block.name}
                </div>
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );
}
