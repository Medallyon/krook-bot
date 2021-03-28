module.exports = {
	apps : [{
		name: "krook-bot",
		cwd: "/krook",
		script: "npm start",

		// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
		args: "",
		instances: 1,
		autorestart: true,
		watch: false,
		max_memory_restart: "256M",
		env: {
			NODE_ENV: "production"
		}
	}]
};
