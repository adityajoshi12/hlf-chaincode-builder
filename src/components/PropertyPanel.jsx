import { useTheme } from '../ThemeContext';
import AssetFieldsManager from './AssetFieldsManager';

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

  return (
    <div className={`w-64 ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-900'} p-4 flex-shrink-0 overflow-y-auto`}>
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
  );
}
