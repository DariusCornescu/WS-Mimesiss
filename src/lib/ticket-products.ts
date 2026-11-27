type WorkshopProduct = { workshopAccess?: boolean | null; extraWorkshops?: number | null }

/**
 * An add-on sells extra workshop places on top of a ticket the buyer already
 * holds. It has no workshop access of its own and gets no QR code.
 */
export function isAddOnProduct(product: WorkshopProduct) {
  return (product.extraWorkshops ?? 0) > 0 && !product.workshopAccess
}

/**
 * A bundle is a full ticket that already includes extra workshop places
 * (for example a limited offer with three workshops). It is sold on its own,
 * gets a QR code, and cannot take an add-on.
 */
export function isBundleProduct(product: WorkshopProduct) {
  return (product.extraWorkshops ?? 0) > 0 && Boolean(product.workshopAccess)
}
