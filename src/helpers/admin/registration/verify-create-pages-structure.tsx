import { PageFormRegistration } from "@/interfaces/formRegistration";

export function createPagesRequest(
    pages: PageFormRegistration[]
  ): PageFormRegistration[] {
    pages.forEach((page, index) => {
        page.page_index = index
    })
  
    return pages;
  }