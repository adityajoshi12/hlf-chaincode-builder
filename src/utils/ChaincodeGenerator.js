import { generateSampleValue, findIdField, generateFunctionParams } from '../utils/CodeGenUtils';

// Main code generation function
export function generateChaincodeCode(
  chaincodeName, 
  chaincodeVersion, 
  canvas, 
  blockProps,
  assetFields
) {
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
              const sampleValue = generateSampleValue(field, i);
              code += `\t\t\t${field.name}:`.padEnd(22) + `${sampleValue},\n`;
            });
            
            code += i < 3 ? `\t\t},\n` : `\t\t},\n`;
          }
          
          code += `\t}\n\n`;
          
          // Find the ID field for using as key
          const idField = findIdField(assetFields);
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
        const { paramList, structInitializers } = generateFunctionParams(assetFields);
        
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
        const idField = findIdField(assetFields);
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
        const { paramList, structInitializers } = generateFunctionParams(assetFields);
        
        // Find the ID field for existence check
        const idField = findIdField(assetFields);
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
        if (!code.includes(`func (s *SmartContract) ${assetType}Exists`)) {
          code += `// ${assetType}Exists returns true when ${assetType.toLowerCase()} exists in the ledger\n`;
          code += `func (s *SmartContract) ${assetType}Exists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {\n`;
          code += `\t${assetVarName}JSON, err := ctx.GetStub().GetState(id)\n`;
          code += `\tif err != nil {\n`;
          code += `\t\treturn false, fmt.Errorf("failed to read from world state: %v", err)\n`;
          code += `\t}\n\n`;
          code += `\treturn ${assetVarName}JSON != nil, nil\n`;
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
  
  return code;
}
