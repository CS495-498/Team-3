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

const notifications = [
  {
    type: "Demo",
    description: "1 The Red Panda Demo site will be under construction from 10:00-10:30 UTC",
    status: "Pending",
  },
  {
    type: "TEST",
    description: "2 The Red Panda Demo site will be under construction from 10:00-10:30 UTC",
    status: "Pending",
  },
  {
    type: "TEST",
    description: "3 The Red Panda Demo site will be under construction from 10:00-10:30 UTC",
    status: "Pending",
  },
  {
    type: "TEST",
    description: "4 The Red Panda Demo site will be under construction from 10:00-10:30 UTC",
    status: "Pending",
  },
  {
    type: "TEST",
    description: "5 The Red Panda Demo site will be under construction from 10:00-10:30 UTC",
    status: "Pending",
  },
  {
    type: "TEST",
    description: "6 The Red Panda Demo site will be under construction from 10:00-10:30 UTC",
    status: "Pending",
  },
  {
    type: "TEST",
    description: "7 The Red Panda Demo site will be under construction from 10:00-10:30 UTC",
    status: "Pending",
  },
]

export function TableDemo() {
  return (
    <Table>
      <TableCaption>Recent Notifications.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Notification Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {notifications.map((notification) => (
          <TableRow key={notification.description}>
            <TableCell className="font-medium">{notification.type}</TableCell>
            <TableCell>{notification.description}</TableCell>
            <TableCell>{notification.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={2}>Total</TableCell>
          <TableCell className="text-right">7</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
