import Navigo from 'navigo'
import { ProcessStep } from './enums/ProcessStep'
import type { Bootstrap } from '../script'

export class AppRouter {
  private readonly router: Navigo
  private readonly app: Bootstrap

  constructor (app: Bootstrap) {
    this.app = app
    // Use History API (clean URLs without #)
    this.router = new Navigo('/', { hash: false })
  }

  public init (): void {
    this.router
      .on('/load-model', () => { this.navigate_to(ProcessStep.LoadModel) })
      .on('/load-skeleton', () => { this.navigate_to(ProcessStep.LoadSkeleton) })
      .on('/edit', () => { this.navigate_to(ProcessStep.EditSkeleton) })
      .on('/animate', () => { this.navigate_to(ProcessStep.AnimationsListing) })
      .on('/export', () => { this.navigate_to(ProcessStep.AnimationsListing) })
      .on(() => { this.navigate_to(ProcessStep.LoadModel) })
      .resolve()
  }

  public update (step: ProcessStep): void {
    switch (step) {
      case ProcessStep.LoadModel:
        this.router.navigate('/load-model'); break
      case ProcessStep.LoadSkeleton:
        this.router.navigate('/load-skeleton'); break
      case ProcessStep.EditSkeleton:
        this.router.navigate('/edit'); break
      case ProcessStep.AnimationsListing:
        this.router.navigate('/animate'); break
      default:
        break
    }
  }

  private navigate_to (step: ProcessStep): void {
    if (this.app.process_step !== step) {
      this.app.process_step = this.app.process_step_changed(step)
    }
  }
}
