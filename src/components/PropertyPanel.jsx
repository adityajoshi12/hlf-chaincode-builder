import { useTheme } from '../ThemeContext';
import AssetFieldsManager from './AssetFieldsManager';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function PropertyPanel({ 
  selectedBlockId, 
  canvas, 
  blockProps, 
  handleUpdateBlockProps,
  assetFields,
  removeAssetField,
  newField,
  setNewField,
  addAssetField,
  editingField,
  startEditingField,
  cancelEditingField,
  updateAssetField
}) {
  const { theme } = useTheme();
  const DEFAULT_WIDTH = 256; // Default width (64 * 4 = 256px)
  const [width, setWidth] = useState(() => {
    // Try to get the saved width from localStorage
    const savedWidth = localStorage.getItem('propertyPanelWidth');
    return savedWidth ? parseInt(savedWidth, 10) : DEFAULT_WIDTH;
  });
  const [isResizing, setIsResizing] = useState(false);
  const minWidth = 200; // Minimum panel width in pixels
  const maxWidth = 600; // Maximum panel width in pixels
  const panelRef = useRef(null);
  
  // Handle mouse down on the resize handle
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle mouse move when resizing
  const handleMouseMove = useCallback((e) => {
    if (!isResizing) return;
    const containerRect = panelRef.current.parentElement.getBoundingClientRect();
    const newWidth = containerRect.right - e.clientX;
    
    // Constrain width between min and max values
    const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    setWidth(constrainedWidth);
    
    // Add a cursor style to the body to indicate resizing
    document.body.style.cursor = 'ew-resize';
  }, [isResizing]);
  
  // Handle mouse up to stop resizing
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'auto'; // Reset cursor style
  }, [handleMouseMove]);
  
  // Add/remove event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div className="relative flex flex-shrink-0">
      {/* Resize handle */}
      <div 
        className={`w-1 h-full cursor-ew-resize z-10 ${isResizing ? 'bg-blue-500' : theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'} hover:bg-blue-400`} 
        onMouseDown={handleMouseDown}
        title="Drag to resize panel"
      ></div>
      
      <div 
        ref={panelRef} 
        className={`${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-900'} p-4 overflow-y-auto`}
        style={{ width: `${width}px` }}
      >
        {/* Asset Fields management UI */}
      <AssetFieldsManager 
        assetFields={assetFields}
        removeAssetField={removeAssetField}
        newField={newField}
        setNewField={setNewField}
        addAssetField={addAssetField}
        editingField={editingField}
        startEditingField={startEditingField}
        cancelEditingField={cancelEditingField}
        updateAssetField={updateAssetField}
      />
      
      <h2 className="font-bold mb-2">Properties</h2>
      
      {selectedBlockId ? (
        <div>
          {(() => {
            const selectedBlock = canvas.find(b => b.instanceId === selectedBlockId);
            const props = blockProps[selectedBlockId] || {};
            
            if (!selectedBlock) return <p>No block selected</p>;
            
            switch(selectedBlock.blockId) {
              case 'init':
                return (
                  <div className="space-y-2">
                    <div>
                      <label className={`block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Init Message:</label>
                      <input 
                        type="text" 
                        value={props.message || ''} 
                        onChange={(e) => handleUpdateBlockProps(selectedBlockId, { message: e.target.value })}
                        className={`w-full px-2 py-1 mt-1 text-sm border rounded ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                );
                
              case 'createAsset':
                return (
                  <div className="space-y-2">
                    <div>
                      <label className={`block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Asset Type:</label>
                      <input 
                        type="text" 
                        value={props.assetType || 'Asset'} 
                        onChange={(e) => handleUpdateBlockProps(selectedBlockId, { assetType: e.target.value })}
                        className={`w-full px-2 py-1 mt-1 text-sm border rounded ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                );
                
              case 'readAsset':
              case 'updateAsset':
              case 'deleteAsset':
              case 'query':
                return (
                  <div className="space-y-2">
                    <p className={`text-sm italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Operation uses the asset type defined in Create Asset blocks.
                    </p>
                  </div>
                );
                
              case 'emitEvent':
                return (
                  <div className="space-y-2">
                    <div>
                      <label className={`block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Event Name:</label>
                      <input 
                        type="text" 
                        value={props.eventName || ''} 
                        onChange={(e) => handleUpdateBlockProps(selectedBlockId, { eventName: e.target.value })}
                        className={`w-full px-2 py-1 mt-1 text-sm border rounded ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Payload:</label>
                      <textarea 
                        value={props.payload || ''} 
                        onChange={(e) => handleUpdateBlockProps(selectedBlockId, { payload: e.target.value })}
                        className={`w-full px-2 py-1 mt-1 text-sm border rounded h-24 ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-gray-100' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  </div>
                );
                
              default:
                return <p className={`text-sm italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No configurable properties for this block
                </p>;
            }
          })()}
        </div>
      ) : (
        <p className={`text-sm italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Select a block to view its properties
        </p>
      )}
      </div>
    </div>
  );
}
