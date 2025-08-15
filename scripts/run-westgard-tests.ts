import { execSync } from "child_process"

async function runWestgardTests() {
  console.log("🧪 Chạy Westgard Compliance Tests...\n")

  try {
    // Run the test suite
    execSync("npm test -- westgard-compliance.test.ts", {
      stdio: "inherit",
      cwd: process.cwd(),
    })

    console.log("\n✅ Tất cả Westgard compliance tests đã PASS!")
    console.log("🎯 Hệ thống tuân thủ đầy đủ chuẩn Westgard")
  } catch (error) {
    console.error("\n❌ Một số tests đã FAIL!")
    console.error("🔧 Cần kiểm tra và sửa lỗi trước khi triển khai")
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  runWestgardTests()
}

export { runWestgardTests }
