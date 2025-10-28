"use client"

import { useState, useEffect } from "react"
import { HomeScreen } from "@/components/Home-screen"

type AppState = "home"

export function AppWrapper() {
  const [appState, setAppState] = useState<AppState>("home")

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName })
        const micPermissionStatus = await navigator.permissions.query({ name: "microphone" as PermissionName })

        if (permissionStatus.state === "granted" && micPermissionStatus.state === "granted") {
          const disclaimerAccepted = localStorage.getItem("digital-lawyer-disclaimer-accepted")
          if (disclaimerAccepted) {
            setAppState("home")
          }
        }
      } catch (error) {
        console.log("Permissions API not supported", error)
      }
    }

    checkPermissions()
  }, [])

  switch (appState) {
    case "home":
      return <HomeScreen />
    default:
      return <HomeScreen />
  }
}
