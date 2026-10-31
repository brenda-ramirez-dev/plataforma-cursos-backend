const obtenerCategorias = `query { categoriesCollection { edges { node { id name description } } } }`;

const obtenerCategoriaPorId = `query ($id: Int!) { categoriesCollection(filter: {id: {eq: $id}}) { edges { node { id name description } } } }`;

const crearCategoria = `mutation ($name: String!, $description: String) { insertIntocategoriesCollection(objects: [{name: $name, description: $description}]) { records { id name } } }`;

const actualizarCategoria = `mutation ($id: Int!, $name: String, $description: String) { updatecategoriesCollection(set: {name: $name, description: $description}, filter: {id: {eq: $id}}) { records { id } } }`;

const eliminarCategoria = `mutation ($id: Int!) { deleteFromcategoriesCollection(filter: {id: {eq: $id}}) { records { id } } }`;

const buscarCategoria = `query ($keyword: String!) { categoriesCollection(filter: {name: {ilike: $keyword}}) { edges { node { id name description } } } }`;

module.exports = { 
  obtenerCategorias, 
  obtenerCategoriaPorId, 
  crearCategoria, 
  actualizarCategoria, 
  eliminarCategoria,
  buscarCategoria
};