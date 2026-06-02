import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryOut } from "../lib/api";

// Mock the api module so the container test controls the network.
vi.mock("../lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/api")>();
  return { ...actual, fetchCategoryTree: vi.fn() };
});

import Categories, { CategoryTree, CategoryDetail } from "./CategoryTree";
import { fetchCategoryTree } from "../lib/api";

const mockedFetch = vi.mocked(fetchCategoryTree);

function cat(id: number, name: string, children: CategoryOut[] = []): CategoryOut {
  return { id, name, children };
}

const tree: CategoryOut[] = [
  cat(1, "Electronics", [
    cat(2, "Phones", [cat(4, "Smartphones")]),
    cat(3, "Laptops"),
  ]),
  cat(10, "Books"),
];

describe("CategoryTree", () => {
  const noop = () => {};

  it("renders all top-level category names", () => {
    render(<CategoryTree categories={tree} onSelect={noop} selectedId={null} />);

    expect(screen.getByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("Books")).toBeInTheDocument();
  });

  it("renders nested children recursively (down to grandchildren)", () => {
    render(<CategoryTree categories={tree} onSelect={noop} selectedId={null} />);

    expect(screen.getByText("Phones")).toBeInTheDocument();
    expect(screen.getByText("Laptops")).toBeInTheDocument();
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
  });

  it("shows a child-count badge only for nodes with children", () => {
    render(<CategoryTree categories={tree} onSelect={noop} selectedId={null} />);

    // Electronics has 2 children -> badge "2"
    const electronics = screen.getByRole("button", { name: /Electronics/ });
    expect(within(electronics).getByText("2")).toBeInTheDocument();

    // Books is a leaf -> no badge, button text is just the name
    const books = screen.getByRole("button", { name: "Books" });
    expect(books).toHaveTextContent(/^Books$/);
  });

  it("increases indentation with nesting level", () => {
    render(<CategoryTree categories={tree} onSelect={noop} selectedId={null} />);

    const top = screen.getByRole("button", { name: /Electronics/ });
    const child = screen.getByRole("button", { name: /Phones/ });
    const grandchild = screen.getByRole("button", { name: "Smartphones" });

    const pad = (el: HTMLElement) => parseInt(el.style.paddingLeft, 10);
    expect(pad(top)).toBe(12); // level 0: 0*16 + 12
    expect(pad(child)).toBe(28); // level 1: 1*16 + 12
    expect(pad(grandchild)).toBe(44); // level 2: 2*16 + 12
  });

  it("applies selected styling only to the selected node", () => {
    render(<CategoryTree categories={tree} onSelect={noop} selectedId={10} />);

    const books = screen.getByRole("button", { name: "Books" });
    const electronics = screen.getByRole("button", { name: /Electronics/ });

    expect(books.className).toContain("bg-indigo-50");
    expect(electronics.className).not.toContain("bg-indigo-50");
  });

  it("calls onSelect with the clicked category, including nested ones", async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(<CategoryTree categories={tree} onSelect={onSelect} selectedId={null} />);

    await user.click(screen.getByRole("button", { name: "Smartphones" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith(cat(4, "Smartphones"));
  });
});

describe("CategoryDetail", () => {
  it("renders the category name and id", () => {
    render(<CategoryDetail category={cat(7, "Garden")} />);

    expect(screen.getByText("Garden")).toBeInTheDocument();
    expect(screen.getByText("ID: 7")).toBeInTheDocument();
  });

  it("lists subcategories with the correct count", () => {
    render(
      <CategoryDetail
        category={cat(1, "Electronics", [cat(2, "Phones"), cat(3, "Laptops")])}
      />,
    );

    expect(screen.getByText("Podkategorie (2)")).toBeInTheDocument();
    expect(screen.getByText("Phones")).toBeInTheDocument();
    expect(screen.getByText("Laptops")).toBeInTheDocument();
  });

  it("omits the subcategories block for a leaf category", () => {
    render(<CategoryDetail category={cat(5, "Pens")} />);

    expect(screen.queryByText(/Podkategorie/)).not.toBeInTheDocument();
  });
});

describe("Categories (container)", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  it("shows a loading spinner until the fetch resolves", async () => {
    let resolve!: (v: { items: CategoryOut[]; total: number }) => void;
    mockedFetch.mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );

    const { container } = render(<Categories />);
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();

    resolve({ items: tree, total: tree.length });
    expect(await screen.findByText("Electronics")).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).not.toBeInTheDocument();
  });

  it("renders the tree and the category count after loading", async () => {
    mockedFetch.mockResolvedValue({ items: tree, total: tree.length });

    render(<Categories />);

    expect(await screen.findByText("Electronics")).toBeInTheDocument();
    expect(screen.getByText("2 kategorii w drzewie")).toBeInTheDocument();
  });

  it("shows the detail panel only after a category is selected", async () => {
    mockedFetch.mockResolvedValue({ items: tree, total: tree.length });
    const user = userEvent.setup();

    render(<Categories />);
    await screen.findByText("Electronics");

    // No detail panel yet.
    expect(screen.queryByText(/Podkategorie/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Electronics/ }));

    expect(screen.getByText("Podkategorie (2)")).toBeInTheDocument();
  });

  it("clears the spinner and logs an error when the fetch fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedFetch.mockRejectedValue(new Error("boom"));

    const { container } = render(<Categories />);

    // Spinner goes away once the (failed) promise settles.
    await vi.waitFor(() =>
      expect(container.querySelector(".animate-spin")).not.toBeInTheDocument(),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to load categories:",
      expect.any(Error),
    );
  });
});
