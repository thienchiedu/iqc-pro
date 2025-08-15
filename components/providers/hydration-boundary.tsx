"use client"

import type React from "react"

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query"

interface HydrationBoundaryWrapperProps {
  children: React.ReactNode
  state: DehydratedState
}

export function HydrationBoundaryWrapper({ children, state }: HydrationBoundaryWrapperProps) {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>
}
