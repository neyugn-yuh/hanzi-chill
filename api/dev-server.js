// Local dev server — chạy api/index.js trên port 3001
import app from "./index.js";

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
});
