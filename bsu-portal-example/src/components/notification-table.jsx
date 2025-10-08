import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertDemo } from "./alert"

export function TableDemo({ content }) {
  return (
    <Table>
      <TableCaption>Feature Requests.</TableCaption>
      <TableHeader>
        <TableRow>
<<<<<<< HEAD
          <TableHead className="w-[200px]">Feature Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Date</TableHead>
=======

>>>>>>> main
        </TableRow>
      </TableHeader>

      <TableBody>
<<<<<<< HEAD
        {content.map((item, index) => {
          console.log("request:", item)
          return (
            <TableRow key={item.request._metadata?.uid || index}>
              <TableCell className="font-medium">
                {item.request.feature_title}
              </TableCell>
              <TableCell>{item.request.feature_description}</TableCell>
              <TableCell>{item.request.author}</TableCell>
              <TableCell>{item.request.date || "—"}</TableCell>
            </TableRow>
          )
        })}
=======
        {notifications.map((notification) => (
          <TableRow key={notification.description}>
            <AlertDemo/>
            <TableCell className="font-medium">{notification.type}</TableCell>
            <TableCell>{notification.description}</TableCell>
            <TableCell>{notification.status}</TableCell>
          </TableRow>
        ))}
>>>>>>> main
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>Total</TableCell>
          <TableCell className="text-right">{content.length}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
