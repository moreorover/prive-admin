import { Hono } from "hono"

import { statementAttachmentRoutes } from "./statement-attachments"
import { uploadRoutes } from "./uploads"

export const apiRoutes = new Hono()

apiRoutes.route("/", uploadRoutes)
apiRoutes.route("/statement-attachments", statementAttachmentRoutes)

export { statementAttachmentRoutes } from "./statement-attachments"
export { uploadRoutes } from "./uploads"
