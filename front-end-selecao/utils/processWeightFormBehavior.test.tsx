import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { useMemo, useState } from "react";

import { calculateGlobalWeightSum } from "@/utils/processWeightValidation";

function WeightFormHarness() {
  const [formData, setFormData] = useState({
    include_curriculum_in_score: false,
    include_portfolio_in_score: true,
    include_certificates_in_score: false,
    has_essay: true,
    weight_curriculum: "0",
    weight_school_records: "10",
    weight_certificates: "0",
    weight_portfolio: "70",
    weight_interview: "20",
    weight_essay: "0",
  });

  const globalWeightSum = useMemo(() => calculateGlobalWeightSum(formData), [formData]);

  return (
    <form>
      <label htmlFor="has_essay">has_essay</label>
      <input
        id="has_essay"
        type="checkbox"
        checked={formData.has_essay}
        onChange={(e) => {
          const checked = e.target.checked;
          setFormData((prev) => ({
            ...prev,
            has_essay: checked,
            weight_essay: checked ? prev.weight_essay : "0",
          }));
        }}
      />

      <label htmlFor="weight_school_records">weight_school_records</label>
      <input
        id="weight_school_records"
        value={formData.weight_school_records}
        onChange={(e) => setFormData((prev) => ({ ...prev, weight_school_records: e.target.value }))}
      />

      <label htmlFor="weight_interview">weight_interview</label>
      <input
        id="weight_interview"
        value={formData.weight_interview}
        onChange={(e) => setFormData((prev) => ({ ...prev, weight_interview: e.target.value }))}
      />

      <output data-testid="weight_essay">{formData.weight_essay}</output>
      <output data-testid="global_sum">{globalWeightSum}</output>
      <output data-testid="is_valid">{String(globalWeightSum === 100)}</output>
    </form>
  );
}

describe("process weight form behavior", () => {
  it("unchecking essay sets essay weight to zero without breaking global validation", () => {
    render(<WeightFormHarness />);

    fireEvent.click(screen.getByLabelText("has_essay"));

    expect(screen.getByTestId("weight_essay")).toHaveTextContent("0");
    expect(screen.getByTestId("global_sum")).toHaveTextContent("100");
    expect(screen.getByTestId("is_valid")).toHaveTextContent("true");
  });

  it("does not force school_records/interview to 100 automatically", () => {
    render(<WeightFormHarness />);

    fireEvent.change(screen.getByLabelText("weight_school_records"), { target: { value: "15" } });
    fireEvent.change(screen.getByLabelText("weight_interview"), { target: { value: "25" } });

    expect(screen.getByLabelText("weight_school_records")).toHaveValue("15");
    expect(screen.getByLabelText("weight_interview")).toHaveValue("25");
    expect(screen.getByTestId("global_sum")).toHaveTextContent("110");
  });
});
