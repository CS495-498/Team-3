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
          <TableHead className="w-[200px]">Feature Title</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Author</TableHead>
          <TableHead>Date</TableHead>

        </TableRow>
      </TableHeader>

      <TableBody>
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
