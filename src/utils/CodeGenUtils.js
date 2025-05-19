// Utility functions for code generation

// Generate sample values for asset fields
export const generateSampleValue = (field, index) => {
  switch(field.type) {
    case 'string':
      if (field.name.toLowerCase() === 'id' || field.jsonTag.toLowerCase() === 'id') {
        return `"asset${index}"`;
      } else if (field.name.toLowerCase() === 'owner' || field.jsonTag.toLowerCase() === 'owner') {
        return `"User${index}"`;
      } else if (field.name.toLowerCase() === 'description' || field.jsonTag.toLowerCase() === 'description') {
        return `"Sample ${field.name} ${index}"`;
      } else {
        return `"Sample ${field.name} ${index}"`;
      }
    case 'int':
      return index * 100;
    case 'float64':
      return index * 10.5;
    case 'bool':
      return index % 2 === 0 ? 'true' : 'false';
    case '[]string':
      return `[]string{"item${index}-1", "item${index}-2"}`;
    case 'map[string]string':
      return `map[string]string{"key${index}": "value${index}"}`;
    default:
      return `"${field.name}${index}"`;
  }
};

// Find the ID field in asset fields
export const findIdField = (assetFields) => {
  return assetFields.find(field => 
    field.name.toLowerCase() === 'id' || 
    field.jsonTag.toLowerCase() === 'id'
  );
};

// Generate function parameters from asset fields
export const generateFunctionParams = (assetFields) => {
  const paramList = [];
  const structInitializers = [];
  
  assetFields.forEach(field => {
    const paramName = field.jsonTag.toLowerCase();
    paramList.push(`${paramName} ${field.type}`);
    structInitializers.push(`\t\t${field.name}:`.padEnd(20) + `${paramName},`);
  });
  
  return { paramList, structInitializers };
};
