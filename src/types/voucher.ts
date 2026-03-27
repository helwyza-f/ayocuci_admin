export interface Voucher {
  vc_id: string;
  vc_voucher: string;
  vc_jenis: "persen" | "nominal";
  vc_nilai_potongan: number;
  vc_keterangan: string;
  vc_tanggalmulai: string;
  vc_tanggalberakhir: string;
  vc_jumlah_voucher: number;
  vc_sisa_voucher: number;
  vc_status: number;
  vc_created: string;
}

export interface EconomyConfig {
  cfg_key: string;
  cfg_value: string;
  cfg_desc: string;
}
