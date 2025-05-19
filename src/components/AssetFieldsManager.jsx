import { Trash2, Plus } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function AssetFieldsManager({ 
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
    <div className="mb-4">
      <h2 className="font-bold mb-2">Asset Fields</h2>
      <div className="space-y-2 mb-2">
        {assetFields.map(field => (
          <div key={field.name} className={`flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} rounded px-2 py-1 text-sm`}>
            {editingField === field.name ? (
              // Editing mode
              <div className="w-full flex flex-col gap-1">
                <div className="flex space-x-1">
                  <input 
                    type="text" 
                    placeholder="Name" 
                    value={newField.name} 
                    onChange={e => setNewField(f => ({...f, name: e.target.value}))} 
                    className={`w-1/3 px-1 py-0.5 border rounded text-xs ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white text-gray-900'
                    }`} 
                  />
                  <select 
                    value={newField.type} 
                    onChange={e => setNewField(f => ({...f, type: e.target.value}))} 
                    className={`w-1/3 px-1 py-0.5 border rounded text-xs ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <option value="string">string</option>
                    <option value="int">int</option>
                    <option value="float64">float64</option>
                    <option value="bool">bool</option>
                    <option value="[]string">[]string</option>
                    <option value="map[string]string">map[string]string</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="json tag" 
                    value={newField.jsonTag} 
                    onChange={e => setNewField(f => ({...f, jsonTag: e.target.value}))} 
                    className={`w-1/3 px-1 py-0.5 border rounded text-xs ${
                      theme === 'dark' 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div className="flex justify-end space-x-1">
                  <button 
                    onClick={cancelEditingField} 
                    className="bg-gray-500 hover:bg-gray-600 text-white rounded px-2 py-0.5 text-xs"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={updateAssetField} 
                    className="bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-0.5 text-xs"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              // Display mode
              <>
                <span className="cursor-pointer hover:underline" onClick={() => startEditingField(field)}>
                  {field.name} <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>({field.type})</span>
                </span>
                <div>
                  <button onClick={() => startEditingField(field)} className="text-blue-500 hover:text-blue-700 mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button onClick={() => removeAssetField(field.name)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <div className="flex space-x-1 mb-2">
        <input 
          type="text" 
          placeholder="Name" 
          value={newField.name} 
          onChange={e => setNewField(f => ({...f, name: e.target.value}))} 
          className={`w-1/3 px-1 py-0.5 border rounded text-xs ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white text-gray-900'
          }`} 
        />
        <select 
          value={newField.type} 
          onChange={e => setNewField(f => ({...f, type: e.target.value}))} 
          className={`w-1/3 px-1 py-0.5 border rounded text-xs ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white text-gray-900'
          }`}
        >
          <option value="string">string</option>
          <option value="int">int</option>
          <option value="float64">float64</option>
          <option value="bool">bool</option>
          <option value="[]string">[]string</option>
          <option value="map[string]string">map[string]string</option>
        </select>
        <input 
          type="text" 
          placeholder="json tag" 
          value={newField.jsonTag} 
          onChange={e => setNewField(f => ({...f, jsonTag: e.target.value}))} 
          className={`w-1/3 px-1 py-0.5 border rounded text-xs ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white text-gray-900'
          }`}
        />
        <button 
          onClick={addAssetField} 
          className="bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-0.5 text-xs"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
