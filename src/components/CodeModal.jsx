import { X, Save, FileText, Copy, Check } from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { useState } from 'react';

export default function CodeModal({ 
  showCodeModal, 
  setShowCodeModal, 
  generatedCode 
}) {
  const { theme } = useTheme();
  const [copied, setCopied] = useState(false);
  
  // State for notification
  const [showNotification, setShowNotification] = useState(false);
  
  // Function to copy code to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode)
      .then(() => {
        setCopied(true);
        setShowNotification(true);
        // Reset the copied state after 2 seconds
        setTimeout(() => {
          setCopied(false);
          setShowNotification(false);
        }, 2000);
      })
      .catch(err => {
        console.error('Failed to copy code: ', err);
      });
  };
  
  if (!showCodeModal) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      {showNotification && (
        <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded shadow-lg flex items-center z-50 animate-fadeIn">
          <Check className="h-4 w-4 mr-2" />
          Code copied to clipboard!
        </div>
      )}
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
          <div className="relative h-full">
            <button 
              onClick={copyToClipboard}
              className={`absolute top-2 right-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-600'} hover:bg-gray-600 ${copied ? 'bg-green-600' : ''} text-white p-2 rounded-md flex items-center transition-colors duration-200`}
              title="Copy code"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-1" /> 
                  <span className="text-xs">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </button>
            <pre className={`${theme === 'dark' ? 'bg-gray-900 border border-gray-700' : 'bg-gray-900'} text-green-400 p-4 rounded-lg overflow-auto h-full w-full`}>
              {generatedCode}
            </pre>
          </div>
        </div>
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} p-3 flex justify-end`}>
          <button 
            onClick={() => setShowCodeModal(false)}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
          >
            Close
          </button>
          <button 
            onClick={() => {
              const blob = new Blob([generatedCode], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'chaincode.go';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
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
