import { X } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function Canvas({ 
  canvas, 
  handleDrop, 
  handleDragOver, 
  handleSelectBlock, 
  handleRemoveBlock, 
  selectedBlockId 
}) {
  const { theme } = useTheme();
  
  return (
    <div 
      className={`flex-1 relative ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'} border overflow-hidden`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {canvas.length === 0 && (
        <div className={`absolute inset-0 flex items-center justify-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
          Drag and drop chaincode blocks here
        </div>
      )}
      
      {canvas.map(block => (
        <div
          key={block.instanceId}
          style={{
            position: 'absolute',
            left: `${block.position.x}px`,
            top: `${block.position.y}px`,
          }}
          className={`${block.color} text-white p-3 rounded shadow-md w-48`}
          onClick={() => handleSelectBlock(block.instanceId)}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="font-medium text-sm">{block.name}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveBlock(block.instanceId);
              }}
              className="text-white hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Show a visual indicator if this block is selected */}
          {selectedBlockId === block.instanceId && (
            <div className="absolute -inset-1 border-2 border-white rounded opacity-75 pointer-events-none"></div>
          )}
        </div>
      ))}
    </div>
  );
}
