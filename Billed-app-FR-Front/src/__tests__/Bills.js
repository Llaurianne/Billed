/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom";
import {within, getByTestId, screen, waitFor, fireEvent} from "@testing-library/dom"
import {beforeEach, beforeAll} from '@jest/globals';
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import Bills from "../containers/Bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockedBills from "../__mocks__/store.js"
jest.mock("../app/store", () => mockedBills);
import router from "../app/Router.js";
import mockStore from "../__mocks__/store.js";

describe("Given I am connected as an employee", () => {
  beforeEach(() => {
    // Mock de localStorage
    Object.defineProperty(window, 'localStorage', {value: localStorageMock})
    window.localStorage.setItem('user', JSON.stringify({
      type: 'Employee'
    }))
  })
  // Ajout de série de tests get
  describe("When I navigate to Bills page", () => {
    beforeEach(() => {
      // Navigation vers la page Bills
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
    })
    test("fetches bills from mock API GET", async () => {
      expect(screen.getByTestId('tbody').querySelectorAll('tr').length).toEqual(4)
      expect(screen.getAllByText('Hôtel et logement')).toBeTruthy
    })
  })
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      // Permet d'utiliser mockImplementation
      jest.spyOn(mockStore, "bills")
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            // Simule le rejet de la promise avec erreur 404
            return Promise.reject(new Error("Erreur 404"))
          }
        }})
      // Chargement de la page Bills
      window.onNavigate(ROUTES_PATH.Bills)
      // Attente de l'étape suivant la promise
      await new Promise(process.nextTick);
      // Attente de l'affichage du message d'erreur
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("fetches messages from an API and fails with 500 message error", async () => {
      mockStore.bills.mockImplementationOnce(() => {
        return {
          list : () =>  {
            // Simule le rejet de la promise avec erreur 500
            return Promise.reject(new Error("Erreur 500"))
          }
        }})
      window.onNavigate(ROUTES_PATH.Bills)
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })

  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Navigation vers la page Bills
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      // Attente d'affichage et sélection de l'icone
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      // Ajout du 'expect' manquant
      expect(windowIcon.classList).toContain('active-icon')
      //expect(screen.getAllByTestId('icon-eye').lenght).toEqual(2)
    })
    test("Then bills should be ordered from earliest to latest", () => {
      // Injection du HTML avec des données mockées de notes de frais
      document.body.innerHTML = BillsUI({data: bills})
      // Sélection de tous les textes sous forme de dates
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      // Comparaison de dates avec sa copie trié par ordre antéchronologique
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })

  // Ajout de test de la fonction handleClickIconEye
  describe("when I am on Bills page and I click on an icon eye", () => {
    test("Then a modal should appear with the picture of the bill", async () => {
      // Version mockée de la fonction de navigation
      const onNavigate = pathname => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Création d'une instance de Bills afin d'appliquer la fonction handleClickIconEye
      const newBills = new Bills({document, onNavigate, localStorage: window.localStorage, store: mockStore });
      // Sélection des icones eye
      const iconEyes = screen.getAllByTestId("icon-eye");
      // Sélection de la modale avec l'image de la note de frais
      const modale = document.getElementById("modaleFile");
      // Mock de la fonction modal() jQuery
      $.fn.modal = jest.fn(() => modale.classList.add("show"));
      // Pour chaque icone vérification de l'exécution de la fonction mockée au click + apparition de la modale
      iconEyes.forEach(iconEye => {
        iconEye.addEventListener("click", () => newBills.handleClickIconEye(iconEye));
        fireEvent.click(iconEye);
        expect($.fn.modal).toHaveBeenCalled();
        expect(modale).toHaveClass("show");
      })
    })
  })

  // Ajout de test de la fonction handleClickNewBill
  describe("when I am on Bills page and I click on 'Nouvelle note de frais'", () => {
    test("Then I should be sent the the new bill page", async () => {
      // Sélection du bouton "Nouvelle note de frais"
      const newBillBtn = screen.getByTestId('btn-new-bill')
      // Version mockée de la fonction de navigation
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname });
      };
      // Création d'une instance de Bills afin d'appliquer la fonction handleClickNewBill
      const newBills = new Bills({document, onNavigate, localStorage: window.localStorage, store: null})
      newBillBtn.addEventListener('click', newBills.handleClickNewBill)
      // Click sur le bouton "Nouvelle note de frais"
      fireEvent.click(newBillBtn)
      // Attente de l'affichage de la nouvelle page
      await waitFor(() => screen.getByText("Envoyer une note de frais"))
      expect(document.querySelector('.content-title').classList).toBeTruthy()
      expect(document.querySelector('.content-title').textContent).toBe(' Envoyer une note de frais ')
    })
  })
})