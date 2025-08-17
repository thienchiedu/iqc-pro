
import { GET, PUT } from "@/app/api/config/system/route"
import { getSheetsService } from "@/lib/google-sheets"
import { type NextRequest } from "next/server"

// Mock the Google Sheets Service
jest.mock("@/lib/google-sheets", () => ({
  getSheetsService: jest.fn().mockReturnValue({
    getSystemSettings: jest.fn(),
    updateSystemSettings: jest.fn(),
  }),
}))

const mockSheetsService = getSheetsService()

describe("/api/config/system", () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("GET", () => {
    it("should fetch and correctly transform system settings", async () => {
      // Arrange
      const mockSettingsFromSheet = {
        laboratory_name: "Test Lab",
        timezone: "UTC",
        date_format: "YYYY-MM-DD",
        data_retention_days: "365",
        automatic_backup_enabled: true,
        email_notifications_enabled: false,
        sms_notifications_enabled: true,
        default_rules__1_3s: true,
        default_rules__2_2s: false,
        default_rules__R_4s: true,
        // Add all other rules...
      }
      mockSheetsService.getSystemSettings.mockResolvedValue(mockSettingsFromSheet)

      // Act
      const response = await GET()
      const body = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(body.labName).toBe("Test Lab")
      expect(body.smsNotifications).toBe(true)
      expect(body.defaultWestgardRules).toEqual(expect.arrayContaining(["1-3s", "R-4s"]))
      expect(body.defaultWestgardRules).not.toEqual(expect.arrayContaining(["2-2s"]))
    })

    it("should return 404 if no settings are found", async () => {
      // Arrange
      mockSheetsService.getSystemSettings.mockResolvedValue(null)

      // Act
      const response = await GET()

      // Assert
      expect(response.status).toBe(404)
    })
  })

  describe("PUT", () => {
    it("should successfully update settings with valid data", async () => {
      // Arrange
      const mockRequestBody = {
        labName: "Updated Lab Name",
        timezone: "America/New_York",
        dateFormat: "MM/DD/YYYY",
        retentionPeriod: "730",
        autoBackup: false,
        emailNotifications: true,
        smsNotifications: false,
        defaultWestgardRules: ["1-3s", "2-2s"],
      }
      const request = new NextRequest("http://localhost/api/config/system", {
        method: "PUT",
        body: JSON.stringify(mockRequestBody),
      })

      // Act
      const response = await PUT(request)
      const body = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(body.message).toBe("System settings updated successfully.")
      expect(mockSheetsService.updateSystemSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          laboratory_name: "Updated Lab Name",
          timezone: "America/New_York",
          default_rules__1_3s: true,
          default_rules__2_2s: true,
          default_rules__R_4s: false, // Ensure unselected rules are false
        })
      )
    })

    it("should return 422 for invalid data", async () => {
      // Arrange
      const mockInvalidBody = { labName: "" } // Missing required fields
      const request = new NextRequest("http://localhost/api/config/system", {
        method: "PUT",
        body: JSON.stringify(mockInvalidBody),
      })

      // Act
      const response = await PUT(request)

      // Assert
      expect(response.status).toBe(422)
      expect(mockSheetsService.updateSystemSettings).not.toHaveBeenCalled()
    })
  })
})
