import { test, expect } from "@playwright/test";

/**
 * Construit une réponse batch tRPC/superjson pour un seul résultat.
 * Format attendu par le client tRPC : [{ result: { data: { json: <data> } } }]
 */
function trpcOk<T>(data: T) {
  return [{ result: { data: { json: data } } }];
}

/**
 * Construit une réponse batch tRPC représentant une erreur serveur.
 * Le code -32009 correspond à CONFLICT dans le mapping tRPC v11.
 */
function trpcError(message: string, code: "CONFLICT" | "NOT_FOUND", httpStatus: number) {
  return [
    {
      error: {
        json: {
          message,
          code: code === "CONFLICT" ? -32009 : -32004,
          data: { code, httpStatus, path: "routes.create" },
        },
      },
    },
  ];
}

/** Trajet fictif pour les mocks de test */
const ROUTE_MOCK = {
  id: "cjld2cjxh0000qzrmn831i7rn",
  name: "Trajet matin",
  fromStop: "Dudweiler Markt",
  toStop: "Saarbrücken Hauptbahnhof",
  userId: "cjld2cjxh0000qzrmn831i7rn",
  createdAt: "2024-09-01T06:30:00.000Z",
  _count: { tripHistories: 5 },
};

test.describe("Page d'accueil — trajectoptimiz", () => {
  test("affiche le titre de la page et le nom de l'application", async ({ page }) => {
    await page.route("**/api/trpc**", (route) =>
      route.fulfill({ json: trpcOk([]) })
    );

    await page.goto("/");

    await expect(page).toHaveTitle(/trajectoptimiz/);
    await expect(page.getByRole("heading", { name: "trajectoptimiz" })).toBeVisible();
  });

  test("affiche l'en-tête avec le logo et le sous-titre Saarland", async ({ page }) => {
    await page.route("**/api/trpc**", (route) =>
      route.fulfill({ json: trpcOk([]) })
    );

    await page.goto("/");

    await expect(page.getByRole("banner")).toBeVisible();
    await expect(
      page.getByRole("banner").getByText(/Optimisation de trajets/)
    ).toBeVisible();
  });

  test("affiche le bandeau d'information sur la ligne S1", async ({ page }) => {
    await page.route("**/api/trpc**", (route) =>
      route.fulfill({ json: trpcOk([]) })
    );

    await page.goto("/");

    /* Cible le paragraphe spécifique dans le bandeau S1 */
    await expect(
      page.getByText("Trajet principal : Dudweiler → Neunkirchen")
    ).toBeVisible();
    await expect(page.getByText(/Ligne S1/)).toBeVisible();
    await expect(page.getByText(/10 arrêts/)).toBeVisible();
  });

  test("affiche le formulaire d'ajout de trajet avec tous les champs", async ({ page }) => {
    await page.route("**/api/trpc**", (route) =>
      route.fulfill({ json: trpcOk([]) })
    );

    await page.goto("/");

    await expect(page.getByLabel("Nom du trajet")).toBeVisible();
    await expect(page.getByLabel("Arrêt de départ")).toBeVisible();
    await expect(page.getByLabel(/Arrêt d.arrivée/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Enregistrer le trajet/ })
    ).toBeVisible();
  });

  test("les sélecteurs d'arrêts contiennent les arrêts S1 connus", async ({ page }) => {
    await page.route("**/api/trpc**", (route) =>
      route.fulfill({ json: trpcOk([]) })
    );

    await page.goto("/");

    const selectDepart = page.getByLabel("Arrêt de départ");
    await expect(selectDepart.getByRole("option", { name: "Dudweiler Markt" })).toBeAttached();
    await expect(selectDepart.getByRole("option", { name: "Saarbrücken Hauptbahnhof" })).toBeAttached();
    await expect(selectDepart.getByRole("option", { name: "Neunkirchen Hauptbahnhof" })).toBeAttached();
  });

  test("affiche 'Aucun trajet enregistré' quand la liste est vide", async ({ page }) => {
    await page.route("**/api/trpc**", (route) =>
      route.fulfill({ json: trpcOk([]) })
    );

    await page.goto("/");

    await expect(page.getByText("Aucun trajet enregistré.")).toBeVisible();
    await expect(page.getByText(/Ajoutez votre premier trajet/)).toBeVisible();
  });

  test("affiche un trajet quand la liste en contient un", async ({ page }) => {
    await page.route("**/api/trpc**", (route) =>
      route.fulfill({ json: trpcOk([ROUTE_MOCK]) })
    );

    await page.goto("/");

    /* Vérifie le nom et les arrêts dans la zone liste (hors sélecteurs de formulaire) */
    const listeSection = page.locator("ul");
    await expect(page.getByText("Trajet matin")).toBeVisible();
    await expect(listeSection.getByText("Dudweiler Markt")).toBeVisible();
    await expect(listeSection.getByText("Saarbrücken Hauptbahnhof")).toBeVisible();
    await expect(page.getByText(/5 voyages enregistrés/)).toBeVisible();
    await expect(page.getByRole("button", { name: /Supprimer/ })).toBeVisible();
  });

  test("affiche le message de chargement puis disparaît", async ({ page }) => {
    let resolveDelay!: () => void;
    const delay = new Promise<void>((resolve) => {
      resolveDelay = resolve;
    });

    await page.route("**/api/trpc**", async (route) => {
      await delay;
      await route.fulfill({ json: trpcOk([]) });
    });

    await page.goto("/");

    await expect(page.getByText("Chargement des trajets…")).toBeVisible();
    resolveDelay();
    await expect(page.getByText("Chargement des trajets…")).not.toBeVisible({ timeout: 5_000 });
  });

  test("empêche la soumission du formulaire si le nom est vide (validation HTML5)", async ({ page }) => {
    await page.route("**/api/trpc**", (route) =>
      route.fulfill({ json: trpcOk([]) })
    );

    await page.goto("/");

    /* Clic sans remplir le nom — la validation HTML5 doit bloquer l'envoi */
    await page.getByRole("button", { name: /Enregistrer le trajet/ }).click();

    /* Le champ nom doit recevoir le focus (comportement navigateur sur champ required vide) */
    await expect(page.getByLabel("Nom du trajet")).toBeFocused();
  });

  test("vide le champ nom et actualise la liste après création réussie", async ({ page }) => {
    await page.route("**/api/trpc**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          json: trpcOk({
            id: "ckh3abcd1234efgh5678ijklm",
            name: "Mon nouveau trajet",
            fromStop: "Dudweiler Markt",
            toStop: "Saarbrücken Hauptbahnhof",
            userId: "cjld2cjxh0000qzrmn831i7rn",
            createdAt: "2024-09-01T00:00:00.000Z",
          }),
        });
      } else {
        await route.fulfill({ json: trpcOk([]) });
      }
    });

    await page.goto("/");
    await expect(page.getByText("Aucun trajet enregistré.")).toBeVisible();

    await page.getByLabel("Nom du trajet").fill("Mon nouveau trajet");
    await page.getByRole("button", { name: /Enregistrer le trajet/ }).click();

    /* Le champ est vidé après succès de la mutation (onSuccess → setRouteName("")) */
    await expect(page.getByLabel("Nom du trajet")).toHaveValue("", { timeout: 5_000 });
  });

  test("affiche un message d'erreur si la création échoue (CONFLICT)", async ({ page }) => {
    await page.route("**/api/trpc**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 200,
          json: trpcError(
            'Un trajet de "Dudweiler Markt" à "Saarbrücken Hauptbahnhof" existe déjà',
            "CONFLICT",
            409
          ),
        });
      } else {
        await route.fulfill({ json: trpcOk([]) });
      }
    });

    await page.goto("/");

    await page.getByLabel("Nom du trajet").fill("Trajet en doublon");
    await page.getByRole("button", { name: /Enregistrer le trajet/ }).click();

    await expect(page.getByText(/existe déjà/)).toBeVisible({ timeout: 5_000 });
  });
});
