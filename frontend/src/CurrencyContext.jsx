import { createContext, useContext, useState } from "react";
import { CURRENCIES, getCurrency } from "./currency";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currencyCode, setCurrencyCode] = useState(
    () => sessionStorage.getItem("ft_currency") || "INR"
  );

  const currency = getCurrency(currencyCode);

  function changeCurrency(code) {
    sessionStorage.setItem("ft_currency", code);
    setCurrencyCode(code);
  }

  return (
    <CurrencyContext.Provider value={{ currency, currencyCode, changeCurrency, CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
