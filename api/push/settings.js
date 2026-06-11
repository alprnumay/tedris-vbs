const push = require("../lib/push-vercel.cjs");
module.exports = async function handler(req, res) {
  if (req.method === "GET") return push.getSettings(req, res);
  if (req.method === "POST") return push.postSettings(req, res);
  res.status(405).json({ ok: false, error: "Method not allowed" });
};
