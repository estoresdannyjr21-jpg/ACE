export declare const REIMBURSABLE_DOC_TYPES: readonly ["TOLL", "GAS", "PARKING"];
export type ReimbursableDocType = (typeof REIMBURSABLE_DOC_TYPES)[number];
export declare class UploadReimbursableDocDto {
    docType: ReimbursableDocType;
    fileKey: string;
}
