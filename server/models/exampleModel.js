const mongoose = require('mongoose');

const exampleSchema = new mongoose.Schema({
  name: String,
  age: Number
});

const Example = mongoose.model('Example', exampleSchema);

module.exports = Example;
/* Mongoose Model Template - Summary
 * --------------------------------
 * 1. Import mongoose
 * 2. Define a Schema object describing the data structure
 *    - Specify fields with types, validation, defaults, uniqueness etc.
 * 3. (Optional) Add instance methods to the schema (schema.methods)
 * 4. (Optional) Add static methods to the schema (schema.statics)
 * 5. (Optional) Use pre/post middleware hooks (e.g. for hashing passwords)
 * 6. Create and export the model with mongoose.model(ModelName, schema)*/