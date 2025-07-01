import { loadApiConfig } from "../config/apiConfig";
import {
  Company,
  CompanyUpdateRequest,
  CompanyImageUploadRequest,
  CompanyStats,
  CompanyAnalytics,
  CompanyMember,
  AddCompanyMemberRequest,
  ApiResponse,
} from "../types/company.types";

const { apiUrl } = loadApiConfig();

export class CompanyService {
  static async getCompanyProfile(): Promise<Company> {
    const response = await fetch(`${apiUrl}/company/profile`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("فشل في جلب بيانات الشركة");
    }
    const data: { success: boolean; company?: Company; error?: string } =
      await response.json();
    if (!data.success || !data.company) {
      throw new Error(data.error || "فشل في جلب بيانات الشركة");
    }

    return data.company;
  }

  static async updateCompanyProfile(
    updateData: CompanyUpdateRequest
  ): Promise<Company> {
    const response = await fetch(`${apiUrl}/company/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      throw new Error("فشل في تحديث بيانات الشركة");
    }
    const data: { success: boolean; company?: Company; error?: string } =
      await response.json();
    if (!data.success || !data.company) {
      throw new Error(data.error || "فشل في تحديث بيانات الشركة");
    }

    return data.company;
  }
  static async uploadCompanyImage(
    imageData: CompanyImageUploadRequest
  ): Promise<string> {
    try {
      console.log("CompanyService.uploadCompanyImage called with:", {
        fileName: imageData.file.name,
        fileSize: imageData.file.size,
        fileType: imageData.file.type,
        type: imageData.type,
        apiUrl: apiUrl,
      });

      const formData = new FormData();
      formData.append("image", imageData.file);
      formData.append("type", imageData.type);

      console.log("FormData created:", {
        hasImage: formData.has("image"),
        hasType: formData.has("type"),
        type: formData.get("type"),
      });

      const response = await fetch(`${apiUrl}/company/upload-image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      console.log("Upload response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload failed with response:", errorText);
        throw new Error(
          `فشل في رفع الصورة: ${response.status} ${response.statusText}`
        );
      }

      const data: ApiResponse<{ imageUrl: string }> = await response.json();
      console.log("Upload response data:", data);

      if (!data.success || !data.data?.imageUrl) {
        console.error("Upload response indicates failure:", data);
        throw new Error(
          data.error || "فشل في رفع الصورة - لم يتم إرجاع رابط الصورة"
        );
      }

      console.log("Upload successful, returning URL:", data.data.imageUrl);
      return data.data.imageUrl;
    } catch (error) {
      console.error("CompanyService.uploadCompanyImage error:", error);
      throw error;
    }
  }
  static async getCompanyStats(): Promise<CompanyStats> {
    const response = await fetch(`${apiUrl}/company/stats`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("فشل في جلب إحصائيات الشركة");
    }

    const data: { success: boolean; stats?: CompanyStats; error?: string } =
      await response.json();
    console.log("Company stats response:", data);

    if (!data.success || !data.stats) {
      throw new Error(data.error || "فشل في جلب إحصائيات الشركة");
    }

    return data.stats;
  }
  static async getCompanyAnalytics(): Promise<CompanyAnalytics> {
    const response = await fetch(`${apiUrl}/company/analytics`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("فشل في جلب تحليلات الشركة");
    }

    const data: {
      success: boolean;
      analytics?: CompanyAnalytics;
      error?: string;
    } = await response.json();

    if (!data.success || !data.analytics) {
      throw new Error(data.error || "فشل في جلب تحليلات الشركة");
    }

    return data.analytics;
  }

  static async getCompanyMembers(): Promise<CompanyMember[]> {
    const response = await fetch(`${apiUrl}/company/members`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("فشل في جلب أعضاء الشركة");
    }

    const data: {
      success: boolean;
      members?: CompanyMember[];
      error?: string;
    } = await response.json();
    if (!data.success || !data.members) {
      throw new Error(data.error || "فشل في جلب أعضاء الشركة");
    }
    console.log("Company members response:", data);

    return data.members;
  }
  static async addCompanyMember(
    memberData: AddCompanyMemberRequest
  ): Promise<CompanyMember> {
    const response = await fetch(`${apiUrl}/company/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(memberData),
    });

    if (!response.ok) {
      throw new Error("فشل في إضافة عضو جديد");
    }

    const data: {
      success: boolean;
      member?: CompanyMember;
      message?: string;
      error?: string;
    } = await response.json();

    if (!data.success) {
      throw new Error(data.error || "فشل في إضافة عضو جديد");
    } // Return the actual member data from the backend
    if (data.member) {
      return {
        ...data.member,
        isActive: data.member.status === "active" || !data.member.status,
      };
    }

    // Fallback if backend doesn't return member data yet
    return {
      id: Date.now(),
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      email: memberData.email,
      role: memberData.role,
      joinedAt: new Date().toISOString(),
      isActive: false,
      status: "pending_activation",
    };
  }
  static async removeCompanyMember(memberId: number): Promise<void> {
    const response = await fetch(`${apiUrl}/company/members/${memberId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("فشل في حذف العضو");
    }

    const data: { success: boolean; error?: string } = await response.json();
    if (!data.success) {
      throw new Error(data.error || "فشل في حذف العضو");
    }
  }
}
