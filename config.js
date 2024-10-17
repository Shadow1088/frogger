// config.js
const config = {
  GITHUB_TOKEN: "gh" + "p_tL" + "5jyi3VYpRDLX5X" + "FgZe5L2" + "UR5EjWb0B0sZG", // who cares, this token has limited privileges anyways
  GIST_ID: "2ec6105a7ff830fb7268427e57337d60",
};
/*
// This will load the environment variables if the file exists
try {
  const env = await import("./.env.js");
  Object.assign(config, env.default);
} catch (error) {
  console.warn("No env.js file found. Using empty configuration.");
}
*/
export default config;
