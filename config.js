// config.js
const config = {
  GITHUB_TOKEN: "", // Will be populated from .env.js
  GIST_ID: "", // Will be populated from .env.js
};

// This will load the environment variables if the file exists
try {
  const env = await import("./env.js");
  Object.assign(config, env.default);
} catch (error) {
  console.warn("No env.js file found. Using empty configuration.");
}

export default config;
