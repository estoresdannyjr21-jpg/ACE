import { ReimbursableStatus } from '@prisma/client';
export declare class PayoutBatchExclusionDto {
    tripId: string;
    reason: string;
}
export declare class CreatePayoutBatchDto {
    operatorId: string;
    clientAccountId: string;
    targetReleaseDate: string;
    includedTripIds: string[];
    exclusions: PayoutBatchExclusionDto[];
}
export declare class GetPayoutBatchesQueryDto {
    operatorId?: string;
    clientAccountId?: string;
    status?: string;
    targetReleaseDate?: string;
}
export declare class GetEligibleTripsQueryDto {
    targetReleaseDate: string;
    operatorId: string;
    clientAccountId: string;
}
export declare class SetBatchHeldDto {
    held: boolean;
}
export declare class SubmitOverrideRequestDto {
    reason: string;
}
export declare class RejectOverrideRequestDto {
    rejectionReason: string;
}
export declare class UpdateReimbursablesDto {
    tollAmount?: number;
    gasAmount?: number;
    parkingAmount?: number;
    reimbursableStatus?: ReimbursableStatus;
}
