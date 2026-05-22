import type { SystemEmailTemplates } from "@/types/site";

export const defaultSystemEmailTemplates: SystemEmailTemplates = {
  activation: {
    subject: {
      en: "Activate your Attacker 2026 account",
      vi: "Kích hoạt tài khoản Attacker 2026",
    },
    preview: {
      en: "Confirm your email to activate the competition account and enter the workspace.",
      vi: "Xác nhận email để kích hoạt tài khoản dự thi và truy cập Đội thi.",
    },
    headline: {
      en: "Activate your competition account.",
      vi: "Kích hoạt tài khoản dự thi của bạn.",
    },
    intro: {
      en: "Hello {{name}}, your Attacker 2026 account has been created. Confirm this email address to activate the account and continue into the competition workspace.",
      vi: "Chào {{name}}, tài khoản Attacker 2026 của bạn đã được tạo. Hãy xác nhận địa chỉ email này để kích hoạt tài khoản và tiếp tục vào không gian cuộc thi.",
    },
    actionLabel: {
      en: "Activate account",
      vi: "Kích hoạt tài khoản",
    },
    actionHint: {
      en: "This activation link expires in 24 hours. If the button does not work, open this link manually: {{link}}",
      vi: "Liên kết kích hoạt này hết hạn sau 24 giờ. Nếu nút không hoạt động, hãy mở trực tiếp liên kết sau: {{link}}",
    },
    footer: {
      en: "If you did not register for Attacker 2026, you can safely ignore this email.",
      vi: "Nếu bạn không đăng ký Attacker 2026, bạn có thể bỏ qua email này.",
    },
  },
  passwordReset: {
    subject: {
      en: "Reset your Attacker 2026 password",
      vi: "Đặt lại mật khẩu Attacker 2026",
    },
    preview: {
      en: "Use the secure link below to choose a new password for your account.",
      vi: "Hãy dùng liên kết bảo mật bên dưới để chọn mật khẩu mới cho tài khoản.",
    },
    headline: {
      en: "Choose a new password.",
      vi: "Chọn mật khẩu mới.",
    },
    intro: {
      en: "Hello {{name}}, we received a request to reset the password for your Attacker 2026 account. Use the secure link below to choose a new password.",
      vi: "Chào {{name}}, hệ thống vừa nhận được yêu cầu đặt lại mật khẩu cho tài khoản Attacker 2026 của bạn. Hãy dùng liên kết bảo mật bên dưới để chọn mật khẩu mới.",
    },
    actionLabel: {
      en: "Reset password",
      vi: "Đặt lại mật khẩu",
    },
    actionHint: {
      en: "This reset link expires in 60 minutes. If the button does not work, open this link manually: {{link}}",
      vi: "Liên kết đặt lại mật khẩu này hết hạn sau 60 phút. Nếu nút không hoạt động, hãy mở trực tiếp liên kết sau: {{link}}",
    },
    footer: {
      en: "If you did not request a password reset, no changes will be made to your account.",
      vi: "Nếu bạn không yêu cầu đặt lại mật khẩu, sẽ không có thay đổi nào được áp dụng cho tài khoản của bạn.",
    },
  },
};
