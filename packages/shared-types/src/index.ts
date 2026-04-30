// กำหนด Type ของข้อมูลบริจาคที่จะใช้วิ่งผ่านทั้งระบบ (Webhook -> Redis -> Overlay -> Next.js)
export interface DonationAlert {
  id: string;
  senderName: string;
  message: string;
  amount: number;
  timestamp: string;
}

export interface StreamerProfile {
  id: string;
  displayName: string;
  promptPayId: string;
}