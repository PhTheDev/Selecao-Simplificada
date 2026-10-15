import {
  calculateGlobalWeightSum,
  isGlobalWeightValid,
  type ProcessWeightValidationInput,
} from "@/utils/processWeightValidation";

describe("processWeightValidation", () => {
  it.each([
    {
      name: "case obrigatorio 81 usa pesos 10/70/20 e ignora redacao",
      formData: {
        include_curriculum_in_score: false,
        include_portfolio_in_score: true,
        include_certificates_in_score: false,
        has_essay: false,
        weight_curriculum: "0",
        weight_school_records: "10",
        weight_certificates: "0",
        weight_portfolio: "70",
        weight_interview: "20",
        weight_essay: "30",
      },
      expected: 100,
    },
    {
      name: "case obrigatorio 82 usa pesos 80/20/0",
      formData: {
        include_curriculum_in_score: false,
        include_portfolio_in_score: true,
        include_certificates_in_score: false,
        has_essay: false,
        weight_curriculum: "0",
        weight_school_records: "80",
        weight_certificates: "0",
        weight_portfolio: "20",
        weight_interview: "0",
        weight_essay: "50",
      },
      expected: 100,
    },
  ])("$name", ({ formData, expected }: { formData: ProcessWeightValidationInput; expected: number }) => {
    expect(calculateGlobalWeightSum(formData)).toBe(expected);
    expect(isGlobalWeightValid(formData)).toBe(true);
  });

  it("returns invalid when active global weights sum is not 100", () => {
    const formData = {
      include_curriculum_in_score: true,
      include_portfolio_in_score: false,
      include_certificates_in_score: false,
      has_essay: true,
      weight_curriculum: "20",
      weight_school_records: "20",
      weight_certificates: "0",
      weight_portfolio: "0",
      weight_interview: "20",
      weight_essay: "20",
    };

    expect(calculateGlobalWeightSum(formData)).toBe(80);
    expect(isGlobalWeightValid(formData)).toBe(false);
  });

  it("does not auto-force school_records or interview to 100", () => {
    const formData = {
      include_curriculum_in_score: true,
      include_portfolio_in_score: true,
      include_certificates_in_score: false,
      has_essay: true,
      weight_curriculum: "30",
      weight_school_records: "10",
      weight_certificates: "0",
      weight_portfolio: "30",
      weight_interview: "20",
      weight_essay: "10",
    };

    expect(calculateGlobalWeightSum(formData)).toBe(100);
    expect(Number(formData.weight_school_records)).toBe(10);
    expect(Number(formData.weight_interview)).toBe(20);
  });

  it("ignores essay weight when has_essay is false", () => {
    const formData = {
      include_curriculum_in_score: false,
      include_portfolio_in_score: true,
      include_certificates_in_score: false,
      has_essay: false,
      weight_curriculum: "0",
      weight_school_records: "30",
      weight_certificates: "0",
      weight_portfolio: "40",
      weight_interview: "30",
      weight_essay: "50",
    };

    expect(calculateGlobalWeightSum(formData)).toBe(100);
    expect(isGlobalWeightValid(formData)).toBe(true);
  });
});
