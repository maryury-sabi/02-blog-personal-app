import { render, screen } from "@testing-library/react-native";
import React from "react";
import { EntradaForm, type EntradaFormValues } from "@/components/EntradaForm";

describe("Componente EntradaForm", () => {
  const baseProps = {
    onChange: jest.fn(),
    onPickFoto: jest.fn(),
    onDetectCity: jest.fn(),
    cityLoading: false,
    onSaveDraft: jest.fn(),
    onPublish: jest.fn(),
  };

  it("el botón «Publicar» queda deshabilitado con formulario inválido", async () => {
    const invalidValues: EntradaFormValues = {
      titulo: "Hi",
      contenido: "Corto",
      etiquetasTexto: "",
      lugar: "",
      altitudM: null,
      fotoUri: null,
    };
    await render(<EntradaForm values={invalidValues} {...baseProps} />);
    const publishBtn = screen.getByLabelText("Publicar entrada");
    expect(publishBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it("el botón «Publicar» se habilita cuando título y contenido son válidos", async () => {
    const validValues: EntradaFormValues = {
      titulo: "Título válido del diario",
      contenido: "Contenido válido con más de diez caracteres.",
      etiquetasTexto: "diario",
      lugar: "Medellín",
      altitudM: 1500,
      fotoUri: null,
    };
    await render(<EntradaForm values={validValues} {...baseProps} />);
    const publishBtn = screen.getByLabelText("Publicar entrada");
    expect(publishBtn.props.accessibilityState?.disabled).toBe(false);
  });
});
