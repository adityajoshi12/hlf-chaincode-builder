import { useState, useCallback } from 'react';
import { X, Plus, Trash2, Save, Code, ArrowRight, Database, FileText, Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeContext';

// Main component for the chaincode builder
export default function ChaincodeDragAndDropBuilder() {
  const { theme, toggleTheme } = useTheme();
  // Define available chaincode blocks
  const [blocks] = useState([
    { id: 'init', name: 'Init Function', category: 'core', color: 'bg-blue-600' },
    { id: 'createAsset', name: 'Create Asset', category: 'assets', color: 'bg-green-600' },
    { id: 'readAsset', name: 'Read Asset', category: 'assets', color: 'bg-green-500' },
    { id: 'updateAsset', name: 'Update Asset', category: 'assets', color: 'bg-green-700' },
    { id: 'deleteAsset', name: 'Delete Asset', category: 'assets', color: 'bg-green-800' },
    { id: 'query', name: 'Query Assets', category: 'assets', color: 'bg-green-400' },
    { id: 'putState', name: 'Put State', category: 'state', color: 'bg-purple-600' },
    { id: 'getState', name: 'Get State', category: 'state', color: 'bg-purple-500' },
    { id: 'delState', name: 'Delete State', category: 'state', color: 'bg-purple-700' },
    { id: 'getStateByRange', name: 'Get State Range', category: 'state', color: 'bg-purple-400' },
    { id: 'createCompositeKey', name: 'Composite Key', category: 'state', color: 'bg-purple-800' },
    { id: 'verifySignature', name: 'Verify Signature', category: 'crypto', color: 'bg-yellow-600' },
    { id: 'getCreator', name: 'Get Creator', category: 'identity', color: 'bg-orange-600' },
    { id: 'checkACL', name: 'Check ACL', category: 'identity', color: 'bg-orange-500' },
    { id: 'emitEvent', name: 'Emit Event', category: 'events', color: 'bg-pink-600' },
  ]);

  // Define state for the canvas (where blocks will be dropped)
  const [canvas, setCanvas] = useState([]);
  const [blockProps, setBlockProps] = useState({});
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [chaincodeName, setChaincodeName] = useState('MyChaincode');
  const [chaincodeVersion, setChaincodeVersion] = useState('1.0');
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  
  // Add state for custom asset fields
  const [assetFields, setAssetFields] = useState([
    { name: 'ID', type: 'string', jsonTag: 'id' },
    { name: 'Description', type: 'string', jsonTag: 'description' },
    { name: 'Owner', type: 'string', jsonTag: 'owner' },
    { name: 'Value', type: 'int', jsonTag: 'value' }
  ]);
  const [newField, setNewField] = useState({ name: '', type: 'string', jsonTag: '' });

  // Function to handle drag start
  const handleDragStart = (e, blockId) => {
    e.dataTransfer.setData('blockId', blockId);
  };
  
  // Function to handle dropping a block onto the canvas
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const blockId = e.dataTransfer.getData('blockId');
    const block = blocks.find(b => b.id === blockId);
    
    if (block) {
      // Create a new instance of the block on the canvas
      const newBlockInstance = {
        instanceId: `${blockId}_${Date.now()}`,
        blockId: blockId,
        name: block.name,
        color: block.color,
        position: { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY }
      };
      
      setCanvas(prev => [...prev, newBlockInstance]);
      
      // Initialize properties for this block
      setBlockProps(prev => ({
        ...prev,
        [newBlockInstance.instanceId]: getDefaultPropsForBlock(blockId)
      }));
    }
  }, [blocks]);
  
  // Function to allow dropping
  const handleDragOver = (e) => {
    e.preventDefault();
  };
  
  // Function to handle selecting a block on the canvas
  const handleSelectBlock = (instanceId) => {
    setSelectedBlockId(instanceId);
  };
  
  // Function to synchronize asset type across all blocks
  // The asset type is stored only on createAsset blocks but is shared across the code generation
  const syncAssetTypeAcrossBlocks = (assetType) => {
    const newBlockProps = { ...blockProps };
    
    // Update asset type for createAsset blocks only
    canvas.forEach(block => {
      if (block.blockId === 'createAsset') {
        if (newBlockProps[block.instanceId]) {
          newBlockProps[block.instanceId] = {
            ...newBlockProps[block.instanceId],
            assetType
          };
        }
      }
    });
    
    setBlockProps(newBlockProps);
  };
  
  // Update handleUpdateBlockProps to synchronize asset type changes
  const handleUpdateBlockProps = (instanceId, updatedProps) => {
    // Check if we're updating an asset type on a createAsset block
    const block = canvas.find(b => b.instanceId === instanceId);
    if (block && block.blockId === 'createAsset' && 
        updatedProps.assetType && 
        blockProps[instanceId]?.assetType !== updatedProps.assetType) {
      // If asset type is changing, synchronize it across all createAsset blocks
      syncAssetTypeAcrossBlocks(updatedProps.assetType);
    }
    
    setBlockProps(prev => ({
      ...prev,
      [instanceId]: {
        ...prev[instanceId],
        ...updatedProps
      }
    }));
  };
  
  // Function to remove a block from the canvas
  const handleRemoveBlock = (instanceId) => {
    setCanvas(prev => prev.filter(block => block.instanceId !== instanceId));
    
    // Also clean up the properties
    setBlockProps(prev => {
      const newProps = {...prev};
      delete newProps[instanceId];
      return newProps;
    });
    
    if (selectedBlockId === instanceId) {
      setSelectedBlockId(null);
    }
  };
  
  // Add field to assetFields
  const addAssetField = () => {
    if (newField.name && newField.jsonTag && !assetFields.some(f => f.name === newField.name)) {
      setAssetFields([...assetFields, newField]);
      setNewField({ name: '', type: 'string', jsonTag: '' });
    }
  };
  // Remove field from assetFields
  const removeAssetField = (name) => {
    setAssetFields(assetFields.filter(f => f.name !== name));
  };

  // Function to generate chaincode from the canvas
  const generateChaincode = () => {
    // This is a simplified version - a real implementation would be more complex
    let code = `// Generated Chaincode: ${chaincodeName} v${chaincodeVersion}\n`;
    code += `package main\n\n`;
    code += `import (\n`;
    code += `\t"fmt"\n`;
    code += `\t"encoding/json"\n`;
    code += `\t"github.com/hyperledger/fabric-contract-api-go/contractapi"\n`;
    code += `)\n\n`;
    
    // Generate asset struct if needed
    if (canvas.some(block => block.blockId.includes('Asset'))) {
      // Get the custom asset type from the first asset block
      let assetType = 'Asset';
      const assetBlock = canvas.find(block => block.blockId.includes('Asset'));
      if (assetBlock && blockProps[assetBlock.instanceId]?.assetType) {
        assetType = blockProps[assetBlock.instanceId].assetType;
      }
      
      code += `// ${assetType} represents a general asset in the ledger\n`;
      code += `type ${assetType} struct {\n`;
      assetFields.forEach(field => {
        code += `\t${field.name} ${field.type} \`json:"${field.jsonTag}"\`\n`;
      });
      code += `}\n\n`;
    }
    
    // Get the asset type once - moved up to fix reference order
    let globalAssetType = 'Asset';
    const assetBlock = canvas.find(block => block.blockId.includes('Asset'));
    if (assetBlock && blockProps[assetBlock.instanceId]?.assetType) {
      globalAssetType = blockProps[assetBlock.instanceId].assetType;
    }
    
    // Get the asset type for comment
    let assetTypeName = "assets";
    if (globalAssetType && globalAssetType !== 'Asset') {
      assetTypeName = globalAssetType.toLowerCase() + "s";
    }
    
    code += `// SmartContract provides functions for managing ${assetTypeName}\n`;
    code += `type SmartContract struct {\n`;
    code += `\tcontractapi.Contract\n`;
    code += `}\n\n`;

    // Generate function for each block
    canvas.forEach(block => {
      const props = blockProps[block.instanceId] || {};
      
      switch(block.blockId) {
        case 'init': {
          // Get the asset type if there's any asset block
          let assetTypeName = "";
          if (globalAssetType && globalAssetType !== 'Asset') {
            assetTypeName = globalAssetType.toLowerCase() + "s";
          } else {
            assetTypeName = "assets";
          }
          
          const assetType = globalAssetType;
          const assetVarName = assetType.charAt(0).toLowerCase() + assetType.slice(1);
          
          code += `// InitLedger adds a base set of ${assetTypeName} to the ledger\n`;
          code += `func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {\n`;
          code += `\tfmt.Println("${props.message || 'Initializing the chaincode'}")\n`;

          // Only add sample assets if there's a create asset block
          if (canvas.some(b => b.blockId === 'createAsset')) {
            code += `\n\t// Create some initial ${assetTypeName}\n`;
            code += `\t${assetVarName}s := []${assetType}{\n`;
            
            // Generate 3 sample assets
            for (let i = 1; i <= 3; i++) {
              code += `\t\t{\n`;
              
              // Generate sample values for each field
              assetFields.forEach(field => {
                let sampleValue;
                switch(field.type) {
                  case 'string':
                    if (field.name.toLowerCase() === 'id' || field.jsonTag.toLowerCase() === 'id') {
                      sampleValue = `"asset${i}"`;
                    } else if (field.name.toLowerCase() === 'owner' || field.jsonTag.toLowerCase() === 'owner') {
                      sampleValue = `"User${i}"`;
                    } else if (field.name.toLowerCase() === 'description' || field.jsonTag.toLowerCase() === 'description') {
                      sampleValue = `"Sample ${assetType} ${i}"`;
                    } else {
                      sampleValue = `"Sample ${field.name} ${i}"`;
                    }
                    break;
                  case 'int':
                    sampleValue = i * 100;
                    break;
                  case 'float64':
                    sampleValue = i * 10.5;
                    break;
                  case 'bool':
                    sampleValue = i % 2 === 0 ? 'true' : 'false';
                    break;
                  case '[]string':
                    sampleValue = `[]string{"item${i}-1", "item${i}-2"}`;
                    break;
                  case 'map[string]string':
                    sampleValue = `map[string]string{"key${i}": "value${i}"}`;
                    break;
                  default:
                    sampleValue = `"${field.name}${i}"`;
                }
                
                code += `\t\t\t${field.name}:`.padEnd(22) + `${sampleValue},\n`;
              });
              
              code += i < 3 ? `\t\t},\n` : `\t\t},\n`;
            }
            
            code += `\t}\n\n`;
            
            // Find the ID field for using as key
            const idField = assetFields.find(field => 
              field.name.toLowerCase() === 'id' || 
              field.jsonTag.toLowerCase() === 'id'
            );
            const idProperty = idField ? idField.name : 'ID';
            
            code += `\tfor _, ${assetVarName} := range ${assetVarName}s {\n`;
            code += `\t\t${assetVarName}JSON, err := json.Marshal(${assetVarName})\n`;
            code += `\t\tif err != nil {\n`;
            code += `\t\t\treturn err\n`;
            code += `\t\t}\n\n`;
            code += `\t\terr = ctx.GetStub().PutState(${assetVarName}.${idProperty}, ${assetVarName}JSON)\n`;
            code += `\t\tif err != nil {\n`;
            code += `\t\t\treturn fmt.Errorf("failed to put to world state: %v", err)\n`;
            code += `\t\t}\n`;
            code += `\t}\n`;
          } else {
            code += `\treturn nil\n`;
          }
          
          code += `}\n\n`;
          break;
        }
          
        case 'createAsset': {
          const assetType = props.assetType || globalAssetType;
          // Convert first letter to lowercase for variable names
          const assetVarName = assetType.charAt(0).toLowerCase() + assetType.slice(1);
          
          code += `// Create${assetType} creates a new ${assetType.toLowerCase()} in the ledger\n`;
          
          // Generate function parameters dynamically based on assetFields
          let paramList = [];
          let structInitializers = [];
          
          assetFields.forEach(field => {
            const paramName = field.jsonTag.toLowerCase();
            paramList.push(`${paramName} ${field.type}`);
            structInitializers.push(`\t\t${field.name}:`.padEnd(20) + `${paramName},`);
          });
          
          code += `func (s *SmartContract) Create${assetType}(ctx contractapi.TransactionContextInterface, ${paramList.join(', ')}) error {\n`;
          code += `\t${assetVarName} := ${assetType}{\n`;
          structInitializers.forEach(initializer => {
            code += `${initializer}\n`;
          });
          code += `\t}\n\n`;
          code += `\t${assetVarName}JSON, err := json.Marshal(${assetVarName})\n`;
          code += `\tif err != nil {\n`;
          code += `\t\treturn err\n`;
          code += `\t}\n\n`;
          
          // Use the ID field for the key in PutState
          const idField = assetFields.find(field => 
            field.name.toLowerCase() === 'id' || 
            field.jsonTag.toLowerCase() === 'id'
          );
          const idParam = idField ? idField.jsonTag.toLowerCase() : 'id';
          
          code += `\treturn ctx.GetStub().PutState(${idParam}, ${assetVarName}JSON)\n`;
          code += `}\n\n`;
          break;
        }
          
        case 'readAsset': {
          const assetType = props.assetType || globalAssetType;
          // Convert first letter to lowercase for variable names
          const assetVarName = assetType.charAt(0).toLowerCase() + assetType.slice(1);
          
          code += `// Read${assetType} returns the ${assetType.toLowerCase()} stored in the ledger\n`;
          code += `func (s *SmartContract) Read${assetType}(ctx contractapi.TransactionContextInterface, id string) (*${assetType}, error) {\n`;
          code += `\t${assetVarName}JSON, err := ctx.GetStub().GetState(id)\n`;
          code += `\tif err != nil {\n`;
          code += `\t\treturn nil, fmt.Errorf("failed to read from world state: %v", err)\n`;
          code += `\t}\n`;
          code += `\tif ${assetVarName}JSON == nil {\n`;
          code += `\t\treturn nil, fmt.Errorf("the ${assetType.toLowerCase()} %s does not exist", id)\n`;
          code += `\t}\n\n`;
          code += `\tvar ${assetVarName} ${assetType}\n`;
          code += `\terr = json.Unmarshal(${assetVarName}JSON, &${assetVarName})\n`;
          code += `\tif err != nil {\n`;
          code += `\t\treturn nil, err\n`;
          code += `\t}\n\n`;
          code += `\treturn &${assetVarName}, nil\n`;
          code += `}\n\n`;
          break;
        }
          
        case 'updateAsset': {
          const assetType = props.assetType || globalAssetType;
          // Convert first letter to lowercase for variable names
          const assetVarName = assetType.charAt(0).toLowerCase() + assetType.slice(1);
          
          code += `// Update${assetType} updates an existing ${assetType.toLowerCase()} in the ledger\n`;
          
          // Generate function parameters dynamically based on assetFields
          let paramList = [];
          let structInitializers = [];
          
          assetFields.forEach(field => {
            const paramName = field.jsonTag.toLowerCase();
            paramList.push(`${paramName} ${field.type}`);
            structInitializers.push(`\t\t${field.name}:`.padEnd(20) + `${paramName},`);
          });
          
          // Find the ID field for existence check
          const idField = assetFields.find(field => 
            field.name.toLowerCase() === 'id' || 
            field.jsonTag.toLowerCase() === 'id'
          );
          const idParam = idField ? idField.jsonTag.toLowerCase() : 'id';
          
          code += `func (s *SmartContract) Update${assetType}(ctx contractapi.TransactionContextInterface, ${paramList.join(', ')}) error {\n`;
          code += `\texists, err := s.${assetType}Exists(ctx, ${idParam})\n`;
          code += `\tif err != nil {\n`;
          code += `\t\treturn err\n`;
          code += `\t}\n`;
          code += `\tif !exists {\n`;
          code += `\t\treturn fmt.Errorf("the ${assetType.toLowerCase()} %s does not exist", ${idParam})\n`;
          code += `\t}\n\n`;
          code += `\t${assetVarName} := ${assetType}{\n`;
          structInitializers.forEach(initializer => {
            code += `${initializer}\n`;
          });
          code += `\t}\n`;
          code += `\t${assetVarName}JSON, err := json.Marshal(${assetVarName})\n`;
          code += `\tif err != nil {\n`;
          code += `\t\treturn err\n`;
          code += `\t}\n\n`;
          code += `\treturn ctx.GetStub().PutState(${idParam}, ${assetVarName}JSON)\n`;
          code += `}\n\n`;
          
          // Add helper function for asset exists if not already added
          if (!code.includes(`${assetType}Exists`)) {
            code += `// ${assetType}Exists returns true when ${assetType.toLowerCase()} exists in the ledger\n`;
            code += `func (s *SmartContract) ${assetType}Exists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {\n`;
            code += `\t${assetVarName}JSON, err := ctx.GetStub().GetState(id)\n`;
            code += `\tif err != nil {\n`;
            code += `\t\treturn false, fmt.Errorf("failed to read from world state: %v", err)\n`;
            code += `\t}\n\n`;
            code += `\treturn ${assetVarName}JSON != null, null\n`;
            code += `}\n\n`;
          }
          break;
        }
          
        case 'deleteAsset': {
          const assetType = props.assetType || globalAssetType;
          // Convert first letter to lowercase for variable names
          const assetVarName = assetType.charAt(0).toLowerCase() + assetType.slice(1);
          
          code += `// Delete${assetType} deletes a ${assetType.toLowerCase()} from the ledger\n`;
          code += `func (s *SmartContract) Delete${assetType}(ctx contractapi.TransactionContextInterface, id string) error {\n`;
          code += `\t// Check if ${assetVarName} exists before deleting\n`;
          code += `\texists, err := s.${assetType}Exists(ctx, id)\n`;
          code += `\tif err != nil {\n`;
          code += `\t\treturn err\n`;
          code += `\t}\n`;
          code += `\tif !exists {\n`;
          code += `\t\treturn fmt.Errorf("the ${assetType.toLowerCase()} %s does not exist", id)\n`;
          code += `\t}\n\n`;
          code += `\treturn ctx.GetStub().DelState(id)\n`;
          code += `}\n\n`;
          break;
        }
          
        case 'query': {
          const assetType = props.assetType || globalAssetType;
          // Convert first letter to lowercase for variable names
          const assetVarName = assetType.charAt(0).toLowerCase() + assetType.slice(1);
          const assetsVarName = assetVarName + "s"; // For the array variable
          
          code += `// Query${assetType}s returns all ${assetType.toLowerCase()}s found in the ledger\n`;
          code += `func (s *SmartContract) Query${assetType}s(ctx contractapi.TransactionContextInterface) ([]*${assetType}, error) {\n`;
          code += `\tresultIterator, err := ctx.GetStub().GetStateByRange("", "")\n`;
          code += `\tif err != nil {\n`;
          code += `\t\treturn nil, err\n`;
          code += `\t}\n`;
          code += `\tdefer resultIterator.Close()\n\n`;
          code += `\tvar ${assetsVarName} []*${assetType}\n`;
          code += `\tfor resultIterator.HasNext() {\n`;
          code += `\t\tqueryResponse, err := resultIterator.Next()\n`;
          code += `\t\tif err != nil {\n`;
          code += `\t\t\treturn nil, err\n`;
          code += `\t\t}\n\n`;
          code += `\t\tvar ${assetVarName} ${assetType}\n`;
          code += `\t\terr = json.Unmarshal(queryResponse.Value, &${assetVarName})\n`;
          code += `\t\tif err != nil {\n`;
          code += `\t\t\treturn nil, err\n`;
          code += `\t\t}\n`;
          code += `\t\t${assetsVarName} = append(${assetsVarName}, &${assetVarName})\n`;
          code += `\t}\n\n`;
          code += `\treturn ${assetsVarName}, nil\n`;
          code += `}\n\n`;
          break;
        }
          
        // Add more cases for other block types
        default:
          code += `// ${block.name} function\n`;
          code += `// TODO: Implement ${block.name}\n\n`;
      }
    });
    
    code += `func main() {\n`;
    code += `\tchaincode, err := contractapi.NewChaincode(new(SmartContract))\n`;
    code += `\tif err != nil {\n`;
    code += `\t\tfmt.Printf("Error creating ${chaincodeName} chaincode: %s", err.Error())\n`;
    code += `\t\treturn\n`;
    code += `\t}\n\n`;
    code += `\tif err := chaincode.Start(); err != nil {\n`;
    code += `\t\tfmt.Printf("Error starting ${chaincodeName} chaincode: %s", err.Error())\n`;
    code += `\t}\n`;
    code += `}\n`;
    
    setGeneratedCode(code);
    setShowCodeModal(true);
  };
  
  // Function to get default properties for a block type
  const getDefaultPropsForBlock = (blockId) => {
    switch(blockId) {
      case 'init':
        return { message: "Initializing the chaincode" };
      case 'createAsset':
        return { assetType: "Asset" };
      case 'emitEvent':
        return { eventName: "NewEvent", payload: "{}" };
      default:
        return {};
    }
  };

  // Categories for the palette
  const categories = [
    { id: 'core', name: 'Core Functions' },
    { id: 'assets', name: 'Asset Operations' },
    { id: 'state', name: 'State Management' },
    { id: 'crypto', name: 'Cryptography' },
    { id: 'identity', name: 'Identity & Access' },
    { id: 'events', name: 'Events' },
  ];

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
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
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Block palette */}
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
        
        {/* Canvas area */}
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
        
        {/* Properties panel */}
        <div className={`w-64 ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-900'} p-4 flex-shrink-0 overflow-y-auto`}>
          {/* Asset Fields management UI */}
          <div className="mb-4">
            <h2 className="font-bold mb-2">Asset Fields</h2>
            <div className="space-y-2 mb-2">
              {assetFields.map(field => (
                <div key={field.name} className={`flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'} rounded px-2 py-1 text-sm`}>
                  <span>{field.name} <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}>({field.type})</span></span>
                  {['ID','Description','Owner','Value'].includes(field.name) ? null : (
                    <button onClick={() => removeAssetField(field.name)} className="text-red-500 hover:text-red-700"><Trash2 className="h-3 w-3" /></button>
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
            <p className="text-sm italic text-gray-600">Select a block to view its properties</p>
          )}
        </div>
      </div>
      
      {/* Code generation modal */}
      {showCodeModal && (
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
      )}
    </div>
  );
}
