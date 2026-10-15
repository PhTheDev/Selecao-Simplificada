import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

import { EditAdminModal } from "@/components/admin/administrators/EditAdminModal";

vi.mock("@/components/ui/Modal", () => ({
  default: ({ isOpen, children, footer }: any) => (isOpen ? <div>{children}{footer}</div> : null),
}));

vi.mock("@/components/ui/Alert", () => ({
  Alert: ({ message }: any) => <div>{message}</div>,
}));

vi.mock("lucide-react", () => {
  const Icon = () => null;
  return {
    Building2: Icon,
    CheckCircle: Icon,
    Eye: Icon,
    EyeOff: Icon,
    KeyRound: Icon,
    Loader2: Icon,
    Mail: Icon,
    User: Icon,
    UserCog: Icon,
    UserRound: Icon,
    Hash: Icon,
  };
});

describe("EditAdminModal", () => {
  it("renders username field and forwards change events", () => {
    const onInputChange = vi.fn();
    const onSubmit = vi.fn();

    render(
      <EditAdminModal
        isOpen
        onClose={() => {}}
        admin={{
          id: 1,
          full_name: "Admin Teste",
          email: "admin@example.com",
          role: "super_admin",
          matricula: "133755",
          department: "TI",
          is_active: true,
          created_at: "",
          updated_at: "",
          user: {
            id: 1,
            username: "admin",
            email: "admin@example.com",
            first_name: "Admin",
            last_name: "Teste",
            is_active: true,
          },
        }}
        formData={{
          username: "admin",
          first_name: "Admin",
          last_name: "Teste",
          email: "admin@example.com",
          role: "super_admin",
          matricula: "133755",
          department: "TI",
          is_active: true,
          password: "",
          password_confirm: "",
        }}
        error={null}
        isUpdating={false}
        currentUserId={1}
        onSubmit={onSubmit}
        onInputChange={onInputChange}
      />,
    );

    const usernameInput = screen.getByLabelText("Nome de usuário *");
    fireEvent.change(usernameInput, { target: { value: "novo_admin" } });

    expect(screen.getByDisplayValue("admin")).toBeInTheDocument();
    expect(onInputChange).toHaveBeenCalled();
  });
});
