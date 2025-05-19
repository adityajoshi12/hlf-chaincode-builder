import { useState, useCallback } from 'react';
import { useTheme } from './ThemeContext';

// Import components
import Header from './components/Header';
import BlockPalette from './components/BlockPalette';
import Canvas from './components/Canvas';
import PropertyPanel from './components/PropertyPanel';
import CodeModal from './components/CodeModal';

// Import utils
import { generateChaincodeCode } from './utils/ChaincodeGenerator';

// Main component for the chaincode builder
export default function ChaincodeDragAndDropBuilder() {
  const { theme } = useTheme();
  
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
  const [editingField, setEditingField] = useState(null); // null when not editing, or the name of the field being edited

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
    // Check if this is a default field
    const isDefaultField = ['ID', 'Description', 'Owner', 'Value'].includes(name);
    
    if (isDefaultField) {
      // Confirm before removing a default field
      if (!window.confirm(`${name} is a default field used in most functions. Are you sure you want to remove it?`)) {
        return;
      }
    }
    
    setAssetFields(assetFields.filter(f => f.name !== name));
  };
  
  // Start editing a field
  const startEditingField = (field) => {
    setEditingField(field.name);
    setNewField({ 
      name: field.name, 
      type: field.type, 
      jsonTag: field.jsonTag 
    });
  };
  
  // Cancel editing a field
  const cancelEditingField = () => {
    setEditingField(null);
    setNewField({ name: '', type: 'string', jsonTag: '' });
  };
  
  // Update an existing field
  const updateAssetField = () => {
    if (newField.name && newField.jsonTag && editingField) {
      setAssetFields(assetFields.map(field => 
        field.name === editingField ? newField : field
      ));
      setNewField({ name: '', type: 'string', jsonTag: '' });
      setEditingField(null);
    }
  };

  // Function to generate chaincode from the canvas
  const generateChaincode = () => {
    const codeOutput = generateChaincodeCode(chaincodeName, chaincodeVersion, canvas, blockProps, assetFields);
    setGeneratedCode(codeOutput);
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
      <Header 
        chaincodeName={chaincodeName}
        setChaincodeName={setChaincodeName}
        chaincodeVersion={chaincodeVersion}
        setChaincodeVersion={setChaincodeVersion}
        generateChaincode={generateChaincode}
      />
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Block palette */}
        <BlockPalette 
          blocks={blocks}
          categories={categories}
          handleDragStart={handleDragStart}
        />
        
        {/* Canvas area */}
        <Canvas 
          canvas={canvas}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
          handleSelectBlock={handleSelectBlock}
          handleRemoveBlock={handleRemoveBlock}
          selectedBlockId={selectedBlockId}
        />
        
        {/* Properties panel */}
        <PropertyPanel 
          selectedBlockId={selectedBlockId}
          canvas={canvas}
          blockProps={blockProps}
          handleUpdateBlockProps={handleUpdateBlockProps}
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
      </div>
      
      {/* Code generation modal */}
      <CodeModal 
        showCodeModal={showCodeModal}
        setShowCodeModal={setShowCodeModal}
        generatedCode={generatedCode}
      />
    </div>
  );
}
