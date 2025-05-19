import { Database, Code, Moon, Sun } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export default function Header({ 
  chaincodeName, 
  setChaincodeName, 
  chaincodeVersion, 
  setChaincodeVersion, 
  generateChaincode 
}) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={`${theme === 'dark' ? 'bg-gray-900 border-b border-gray-700' : 'bg-gray-800'} text-white p-4 flex items-center justify-between`}>
      <div className="flex items-center space-x-2">
        <Database className="h-6 w-6" />
        <h1 className="text-xl font-bold">Hyperledger Fabric Chaincode Builder</h1>
      </div>
      <div className="flex space-x-3 items-center">
        {/* Theme toggle button */}
        <button 
          onClick={toggleTheme} 
          className={`p-2 rounded-full ${theme === 'dark' ? 'bg-gray-700 text-yellow-300' : 'bg-gray-700 text-gray-300'}`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm">Name:</label>
          <input 
            type="text" 
            value={chaincodeName} 
            onChange={(e) => setChaincodeName(e.target.value)}
            className={`px-2 py-1 text-sm rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white text-gray-900'}`}
          />
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm">Version:</label>
          <input 
            type="text" 
            value={chaincodeVersion} 
            onChange={(e) => setChaincodeVersion(e.target.value)}
            className={`px-2 py-1 text-sm rounded w-16 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white text-gray-900'}`}
          />
        </div>
        <button 
          onClick={generateChaincode}
          className="flex items-center bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
        >
          <Code className="h-4 w-4 mr-1" />
          Generate Code
        </button>
      </div>
    </div>
  );
}
