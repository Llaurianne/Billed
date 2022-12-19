/**
 * @jest-environment jsdom
 */

require('jest-fetch-mock').enableMocks();
import { screen, waitFor, fireEvent } from "@testing-library/dom";
import {beforeAll, beforeEach} from '@jest/globals';
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store.js";
import router from "../app/Router.js";
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import { bills } from "../fixtures/bills.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Mock de localStorage
    Object.defineProperty(window, 'localStorage', {value: localStorageMock})
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
  })
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      document.body.innerHTML = ''
    })
    test("Then the vertical layout should be displayed with the logo", () => {
      // Instanciation d'une nouvelle vue de NewBill
      const html = NewBillUI()
      document.body.innerHTML = html
      // Vérification affichage du bandeau vertical
      const verticalLayout = document.querySelector('.vertical-navbar')
      expect(verticalLayout).toBeTruthy()
      // Vérification affichage du logo Billed
      const billed = screen.getByText('Billed')
      expect(billed).toBeTruthy()
    })
    test("Then page title and the form should be displayed", () => {
      // Instanciation d'une nouvelle vue de NewBill
      const html = NewBillUI()
      document.body.innerHTML = html
      // Vérification affichage du titre
      const title = screen.getAllByText('Envoyer une note de frais')
      expect(title).toBeTruthy()
      // Vérification affichage du formulaire
      const form = screen.getAllByTestId('form-new-bill')
      expect(form).toBeTruthy()
    })
    test("Then mail icon in vertical layout should be highlighted", async () => {
      // Navigation vers la page NewBill
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      // Vérification présence de la classe 'active-icon' sur l'icone 'icon-mail'
      const mailIcon = screen.getByTestId('icon-mail')
      expect(mailIcon.classList).toContain('active-icon')
    })

    // Test de la fonction handleChangeFile
    describe("When I add a file with a correct extension", () => {
      test("Then the file input should add the file to its FilesList calling handleChangeFile", async () => {
        // Navigation vers la page NewBill
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
        // Instanciation de newBill
        const newBill = new NewBill({document, onNavigate, localStorage: window.localStorage, store: mockStore });
        // Mock de la fonction handleChangeFile
        const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
        // Sélection de l'input file
        const imageInput = screen.getByTestId("file");
        // Mock de la fonction de validation du format de fichier
        const fileValidation = jest.spyOn(newBill, "fileValidation");
        // Création d'un nouvel objet de type File
        const newFile = new File(["image"], "image.jpg", {type: "image/jpg",})
        // Mock de fetch pour éviter les erreurs dans le rapport de test
        fetch.mockResponse(JSON.stringify({'body':' '}))
        // Ajout d'un évènement déclanchant la fonction
        imageInput.addEventListener("change", handleChangeFile);
        fireEvent.change(imageInput, {target: {files: [newFile]}});
        expect(handleChangeFile).toHaveBeenCalledTimes(1);
        expect(fileValidation(newFile)).toEqual(true);
        expect(handleChangeFile).toReturn()
      })
    })
    describe("When I add a file with a wrong extension", () => {
      test("Then the file input should add the file to its FilesList calling handleChangeFile", async () => {
        // Navigation vers la page NewBill
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
        // Instanciation de newBill
        const newBill = new NewBill({document, onNavigate, localStorage: window.localStorage, store: mockStore });
        // Mock de la fonction handleChangeFile
        const handleChangeFile = jest.spyOn(newBill, "handleChangeFile");
        // Sélection de l'input file
        const imageInput = screen.getByTestId("file");
        // Mock de la fonction de validation du format de fichier
        const fileValidation = jest.spyOn(newBill, "fileValidation");
        // Création d'un nouvel objet de type File
        const newFile = new File(["document"], "image.pdf", {type: "application/pdf",})
        // Mock de fetch pour éviter les erreurs dans le rapport de test
        fetch.mockResponse(JSON.stringify({'body':' '}))
        // Ajout d'un évènement déclanchant la fonction
        imageInput.addEventListener("change", handleChangeFile);
        fireEvent.change(imageInput, {target: {files: [newFile]}});
        expect(handleChangeFile).toHaveBeenCalledTimes(1);
        expect(fileValidation(newFile)).toEqual(false);
      })
    })

    // Test de la fonction handleSubmit
    describe("When I complete correctly every input and I click on submit", () => {
      test("Then I should be sent back the the bills page", () => {
        // Navigation vers la page NewBill
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.NewBill)
         // Instanciation de newBill
        const onNavigate = pathname => {
          document.body.innerHTML = ROUTES({ pathname });
        };
        const newBill = new NewBill({document, onNavigate, localStorage: window.localStorage, store: mockStore });
        // Mock de fetch pour éviter les erreurs dans le rapport de test
        fetch.mockResponse(JSON.stringify({'body':' '}))
        // Completion des inputs
        const billSample = bills[0]
        screen.getByTestId('expense-type').value = billSample.type
        screen.getByTestId('expense-name').value = billSample.name
        screen.getByTestId('datepicker').value = billSample.date
        screen.getByTestId('amount').value = billSample.amount
        screen.getByTestId('vat').value = billSample.vat
        screen.getByTestId('pct').value = billSample.pct
        screen.getByTestId('commentary').value = billSample.commentary
        const newFile = new File(["image"], 'facturefreemobile.jpg', {type:"image/jpeg"})
        // Vérification des champs requis et du format du fichier
        const form = screen.getByTestId('form-new-bill')
        const requiredInputs = form.querySelectorAll('input[required]:not([type=file]), select[required]')
        requiredInputs.forEach(input => {
          expect(input.validity.valueMissing).toEqual(false)
        })
        expect(newBill.fileValidation(newFile)).toBeTruthy()
        // Sélection du bouton Envoyer
        const submitBtn = screen.getByText('Envoyer')
        // Soumission du formulaire
        fireEvent.click(submitBtn)
        // Test affichage de la page Bills
        expect(screen.getByText('Mes notes de frais')).toBeTruthy();
      })
    })
  })
})
