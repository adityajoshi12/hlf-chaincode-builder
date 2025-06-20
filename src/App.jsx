import { useState, useCallback, useEffect } from 'react';
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

  // --- LocalStorage Hydration for initial state ---
  function getInitialProjectState() {
    const saved = localStorage.getItem('hlfChaincodeBuilderProject');
    if (saved) {
      try {
        const project = JSON.parse(saved);
        return {
          canvas: Array.isArray(project.canvas) ? project.canvas : [],
          blockProps: typeof project.blockProps === 'object' ? project.blockProps : {},
          assetFields: Array.isArray(project.assetFields) ? project.assetFields : [
            { name: 'ID', type: 'string', jsonTag: 'id' },
            { name: 'Description', type: 'string', jsonTag: 'description' },
            { name: 'Owner', type: 'string', jsonTag: 'owner' },
            { name: 'Value', type: 'int', jsonTag: 'value' }
          ],
          newField: typeof project.newField === 'object' ? project.newField : { name: '', type: 'string', jsonTag: '' },
          editingField: project.editingField || null,
          chaincodeName: project.chaincodeName || 'MyChaincode',
          chaincodeVersion: project.chaincodeVersion || '1.0',
          selectedBlockId: project.selectedBlockId || null,
        };
      } catch { /* ignore parse errors */ }
    }
    // Defaults
    return {
      canvas: [],
      blockProps: {},
      assetFields: [
        { name: 'ID', type: 'string', jsonTag: 'id' },
        { name: 'Description', type: 'string', jsonTag: 'description' },
        { name: 'Owner', type: 'string', jsonTag: 'owner' },
        { name: 'Value', type: 'int', jsonTag: 'value' }
      ],
      newField: { name: '', type: 'string', jsonTag: '' },
      editingField: null,
      chaincodeName: 'MyChaincode',
      chaincodeVersion: '1.0',
      selectedBlockId: null,
    };
  }

  const initial = getInitialProjectState();
  const [canvas, setCanvas] = useState(initial.canvas);
  const [blockProps, setBlockProps] = useState(initial.blockProps);
  const [assetFields, setAssetFields] = useState(initial.assetFields);
  const [newField, setNewField] = useState(initial.newField);
  const [editingField, setEditingField] = useState(initial.editingField);
  const [chaincodeName, setChaincodeName] = useState(initial.chaincodeName);
  const [chaincodeVersion, setChaincodeVersion] = useState(initial.chaincodeVersion);
  const [selectedBlockId, setSelectedBlockId] = useState(initial.selectedBlockId);
  const [generatedCode, setGeneratedCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  
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
  
  // --- Import/Export Project (JSON) ---
  const exportProject = () => {
    const project = {
      canvas,
      blockProps,
      assetFields,
      newField,
      editingField,
      chaincodeName,
      chaincodeVersion
    };
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${chaincodeName || 'chaincode'}-project.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importProject = (project) => {
    if (!project) return;
    setCanvas(Array.isArray(project.canvas) ? project.canvas : []);
    setBlockProps(typeof project.blockProps === 'object' ? project.blockProps : {});
    setAssetFields(Array.isArray(project.assetFields) ? project.assetFields : []);
    setNewField(typeof project.newField === 'object' ? project.newField : { name: '', type: 'string', jsonTag: '' });
    setEditingField(project.editingField || null);
    setChaincodeName(project.chaincodeName || 'MyChaincode');
    setChaincodeVersion(project.chaincodeVersion || '1.0');
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
      case 'checkACL':
        // Default ABAC check: attribute and value
        return { attribute: 'role', value: 'admin', errorMessage: 'Access denied: insufficient attributes' };
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

  // --- Block Templates & Presets ---
  const blockPresets = [
    {
      name: 'Basic CRUD',
      description: 'Create, Read, Update, Delete Asset',
      blocks: [
        { id: 'createAsset', x: 100, y: 100 },
        { id: 'readAsset', x: 300, y: 100 },
        { id: 'updateAsset', x: 500, y: 100 },
        { id: 'deleteAsset', x: 700, y: 100 }
      ]
    },
    {
      name: 'Asset with Query',
      description: 'CRUD + Query Assets',
      blocks: [
        { id: 'createAsset', x: 100, y: 100 },
        { id: 'readAsset', x: 300, y: 100 },
        { id: 'updateAsset', x: 500, y: 100 },
        { id: 'deleteAsset', x: 700, y: 100 },
        { id: 'query', x: 900, y: 100 }
      ]
    },
    {
      name: 'Init + CRUD',
      description: 'InitLedger and CRUD blocks',
      blocks: [
        { id: 'init', x: 100, y: 100 },
        { id: 'createAsset', x: 300, y: 100 },
        { id: 'readAsset', x: 500, y: 100 },
        { id: 'updateAsset', x: 700, y: 100 },
        { id: 'deleteAsset', x: 900, y: 100 }
      ]
    },
    // --- ABAC Templates ---
    {
      name: 'CRUD with ABAC',
      description: 'CRUD operations with Attribute-Based Access Control check',
      blocks: [
        { id: 'createAsset', x: 300, y: 100 },
        { id: 'checkACL', x: 300, y: 180 },
        { id: 'readAsset', x: 500, y: 100 },
        { id: 'updateAsset', x: 700, y: 100 },
        { id: 'deleteAsset', x: 900, y: 100 }
      ]
    },
    {
      name: 'Init + CRUD + ABAC',
      description: 'Init, CRUD, and ABAC check blocks',
      blocks: [
        { id: 'init', x: 100, y: 100 },
        { id: 'createAsset', x: 300, y: 100 },
        { id: 'checkACL', x: 300, y: 180 },
        { id: 'readAsset', x: 500, y: 100 },
        { id: 'updateAsset', x: 700, y: 100 },
        { id: 'deleteAsset', x: 900, y: 100 }
      ]
    },
    {
      name: 'ABAC Only Example',
      description: 'Minimal ABAC check, create, and read operation',
      blocks: [
        { id: 'createAsset', x: 300, y: 100 },
        { id: 'checkACL', x: 300, y: 180 },
        { id: 'readAsset', x: 500, y: 100 }
      ]
    }
  ];

  const insertPreset = (preset) => {
    // Remove all blocks and add the preset blocks
    const now = Date.now();
    const newBlocks = preset.blocks.map((b, i) => {
      const block = blocks.find(bl => bl.id === b.id);
      return {
        instanceId: `${b.id}_${now + i}`,
        blockId: b.id,
        name: block ? block.name : b.id,
        color: block ? block.color : 'bg-gray-400',
        position: { x: b.x, y: b.y }
      };
    });
    setCanvas(newBlocks);
    // Set default props for each block
    const newBlockProps = {};
    newBlocks.forEach(b => {
      newBlockProps[b.instanceId] = getDefaultPropsForBlock(b.blockId);
    });
    setBlockProps(newBlockProps);
    setSelectedBlockId(null);
  };

  // --- LocalStorage Persistence ---
  // Save to localStorage on state change
  useEffect(() => {
    const project = {
      canvas,
      blockProps,
      assetFields,
      newField,
      editingField,
      chaincodeName,
      chaincodeVersion,
      selectedBlockId
    };
    localStorage.setItem('hlfChaincodeBuilderProject', JSON.stringify(project));
  }, [canvas, blockProps, assetFields, newField, editingField, chaincodeName, chaincodeVersion, selectedBlockId]);

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Header */}
      <Header 
        chaincodeName={chaincodeName}
        setChaincodeName={setChaincodeName}
        chaincodeVersion={chaincodeVersion}
        setChaincodeVersion={setChaincodeVersion}
        generateChaincode={generateChaincode}
        onExportProject={exportProject}
        onImportProject={importProject}
        blockPresets={blockPresets}
        insertPreset={insertPreset}
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
