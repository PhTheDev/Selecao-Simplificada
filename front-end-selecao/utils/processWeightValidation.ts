export interface ProcessWeightValidationInput {
  include_curriculum_in_score: boolean;
  include_portfolio_in_score: boolean;
  include_certificates_in_score: boolean;
  has_essay: boolean;
  weight_curriculum: string | number;
  weight_school_records: string | number;
  weight_certificates: string | number;
  weight_portfolio: string | number;
  weight_interview: string | number;
  weight_essay: string | number;
}

const toNumber = (value: string | number): number => Number(value) || 0;

export const calculateGlobalWeightSum = (formData: ProcessWeightValidationInput): number => {
  let sum = 0;

  if (formData.include_curriculum_in_score) {
    sum += toNumber(formData.weight_curriculum);
  }
  sum += toNumber(formData.weight_school_records);

  if (formData.include_certificates_in_score) {
    sum += toNumber(formData.weight_certificates);
  }
  if (formData.include_portfolio_in_score) {
    sum += toNumber(formData.weight_portfolio);
  }

  sum += toNumber(formData.weight_interview);
  if (formData.has_essay) {
    sum += toNumber(formData.weight_essay);
  }

  return sum;
};

export const isGlobalWeightValid = (formData: ProcessWeightValidationInput): boolean =>
  calculateGlobalWeightSum(formData) === 100;
