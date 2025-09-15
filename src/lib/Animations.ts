/* eslint-disable @typescript-eslint/no-extraneous-class */
import { animate, utils } from 'animejs'

export class Animations {
  public static fadeIn (element: HTMLElement, duration: number = 350): void {
    if (element == null) return
    element.style.opacity = '0'
    element.style.transformOrigin = 'center'
    animate(element, { opacity: [0, 1], duration, easing: 'easeOutQuad' })
  }

  public static fadeSlideInRight (element: HTMLElement, duration: number = 400, offset: number = 12): void {
    if (element == null) return
    element.style.opacity = '0'
    element.style.transform = `translateX(${offset}px)`
    animate(element, {
      opacity: [0, 1],
      translateX: [offset, 0],
      duration,
      easing: 'easeOutCubic'
    })
  }

  public static pulseButton (element: HTMLElement): void {
    if (element == null) return
    utils.remove(element)
    animate(element, {
      // quick pulse only
      scale: [1, 1.05, 1],
      duration: 220,
      easing: 'easeOutQuad'
    })
  }

  public static highlight (element: HTMLElement, color: string = 'rgba(255,255,255,0.25)'): void {
    if (element == null) return
    const initial = element.style.boxShadow
    element.style.boxShadow = `0 0 0 0 ${color}`
    animate(element, {
      opacity: [0, 1],
      boxShadow: [`0 0 0 0 ${color}`, '0 0 0 12px rgba(255,255,255,0)'],
      duration: 600,
      easing: 'easeOutCubic',
      complete: () => { element.style.boxShadow = initial }
    })
  }

  public static stepChange (stepLabelEl: HTMLElement | null, panelEl: HTMLElement | null): void {
    if (stepLabelEl != null) {
      Animations.fadeIn(stepLabelEl, 250)
    }
    if (panelEl != null) {
      Animations.fadeSlideInRight(panelEl, 400, 16)
    }
  }

  public static attachMicroInteractions (): void {
    document.querySelectorAll('button, .button').forEach((el) => {
      el.addEventListener('click', () => { Animations.pulseButton(el as HTMLElement) })
    })

    // subtle hover lift
    document.querySelectorAll('#tool-panel button, #tool-panel .button').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        animate(el as HTMLElement, { translateY: -2, duration: 160, easing: 'easeOutQuad' })
      })
      el.addEventListener('mouseleave', () => {
        animate(el as HTMLElement, { translateY: 0, duration: 160, easing: 'easeOutQuad' })
      })
    })
  }
}
