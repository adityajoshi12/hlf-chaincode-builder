import { X, Save, FileText } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function CodeModal({ 
  showCodeModal, 
  setShowCodeModal, 
  generatedCode 
}) {
  const { theme } = useTheme();
  
  if (!showCodeModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-3/4 h-3/4 max-h-full flex flex-col overflow-hidden`}>
        <div className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-800'} text-white p-3 flex justify-between items-center`}>
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            <h3>Generated Chaincode</h3>
          </div>
          <button 
            onClick={() => setShowCodeModal(false)}
            className="text-white hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={`flex-1 p-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} overflow-hidden`}>
          <pre className={`${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-gray-900'} text-green-400 p-4 rounded-lg overflow-auto h-full w-full`}>
            {generatedCode}
          </pre>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-3 flex justify-end`}>
          <button 
            onClick={() => setShowCodeModal(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
          >
            Close
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Chaincode
          </button>
        </div>
      </div>
    </div>
  );
}
