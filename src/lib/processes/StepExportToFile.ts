/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
import { UI } from '../UI.ts'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { type AnimationClip, Scene } from 'three'
import * as THREE from 'three'
import { VRMAnimation, createVRMAnimationClip } from '@pixiv/three-vrm-animation'

// Note: EventTarget is a built-ininterface and do not need to import it
export class StepExportToFile extends EventTarget {
  private readonly ui: UI = new UI()
  private animation_clips_to_export: AnimationClip[] = []
  private vrm_context: { is_vrm: boolean, source_data_url: string | null, original_filename: string | null, bone_name_map?: Record<string, string>, vrm_instance?: any } = {
    is_vrm: false,
    source_data_url: null,
    original_filename: null
  }

  public set_animation_clips_to_export (all_animations_clips: AnimationClip[], animation_checkboxes: number[]): void {
    this.animation_clips_to_export = []
    animation_checkboxes.forEach((indx) => {
      const original_clip: AnimationClip = all_animations_clips[indx]
      const cloned_clip: AnimationClip = original_clip.clone()
      this.animation_clips_to_export.push(cloned_clip)
    })
  }

  public set_vrm_context (is_vrm: boolean, source_data_url: string | null, original_filename: string | null, bone_name_map?: Record<string, string>, vrm_instance?: any): void {
    this.vrm_context = { is_vrm, source_data_url, original_filename, bone_name_map, vrm_instance }
  }

  public export (skinned_meshes: any[], filename = 'exported_model'): void {
    if (this.animation_clips_to_export.length === 0) {
      console.log('ERROR: No animation clips added to export')
      return
    }

    const export_scene = new Scene()

    // When exporting to a file, we need to temporarily move the skinned mesh to a new scene
    const original_parents = new Map<any, any>()

    skinned_meshes.forEach((final_skinned_mesh) => {
      original_parents.set(final_skinned_mesh, final_skinned_mesh.parent)
      export_scene.add(final_skinned_mesh)
    })

    const format_selector = document.getElementById('export-format') as HTMLSelectElement | null
    const selected_format: string = format_selector?.value ?? 'glb'

    if (selected_format === 'glb') {
      this.export_glb(export_scene, this.animation_clips_to_export, filename)
        .then(() => { this.reparent_after_export(skinned_meshes, export_scene, original_parents) })
        .catch((error) => { console.log('Error exporting GLB:', error) })
      return
    }

    if (selected_format === 'vrm') {
      if (this.vrm_context.is_vrm && this.vrm_context.source_data_url !== null) {
        void this.export_original_vrm_avatar(this.vrm_context.source_data_url, this.vrm_context.original_filename ?? `${filename}.vrm`)
        void this.export_vrma_files(this.animation_clips_to_export)
        this.reparent_after_export(skinned_meshes, export_scene, original_parents)
        return
      }

      console.warn('No VRM context detected. Exporting GLB instead.')
      this.export_glb(export_scene, this.animation_clips_to_export, filename)
        .then(() => { this.reparent_after_export(skinned_meshes, export_scene, original_parents) })
        .catch((error) => { console.log('Error exporting GLB for VRM path:', error) })
      return
    }

    if (selected_format === 'fbx') {
      console.warn('FBX export not supported natively. Exporting GLB instead. Convert GLB to FBX with Blender.')
      this.export_glb(export_scene, this.animation_clips_to_export, filename)
        .then(() => { this.reparent_after_export(skinned_meshes, export_scene, original_parents) })
        .catch((error) => { console.log('Error exporting GLB for FBX conversion:', error) })
      return
    }

    this.export_glb(export_scene, this.animation_clips_to_export, filename)
      .then(() => { this.reparent_after_export(skinned_meshes, export_scene, original_parents) })
      .catch((error) => { console.log('Error exporting GLB:', error) })
  }

  private reparent_after_export (skinned_meshes: any[], export_scene: Scene, original_parents: Map<any, any>): void {
        skinned_meshes.forEach((final_skinned_mesh) => {
          const original_par = original_parents.get(final_skinned_mesh)
          if (original_par != null) {
            original_par.add(final_skinned_mesh)
          } else {
            export_scene.remove(final_skinned_mesh)
            console.log('ERROR: No original parent found for skinned mesh when exporting and re-parenting to original scene')
      }
    })
  }

  private async export_original_vrm_avatar (data_url: string, output_filename: string): Promise<void> {
    try {
      const response = await fetch(data_url)
      const blob = await response.blob()
      const filename = output_filename.toLowerCase().endsWith('.vrm') ? output_filename : `${output_filename}.vrm`
      this.save_file(blob, filename)
    } catch (err) {
      console.warn('Failed to export original VRM avatar from source data URL', err)
    }
  }

  private async export_vrma_files (clips: AnimationClip[]): Promise<void> {
    for (const clip of clips) {
      try {
        const vrma = new VRMAnimation()
        vrma.duration = clip.duration

        clip.tracks.forEach((track: any) => {
          const name = String(track.name)
          const parts = name.split('.')
          if (parts.length < 2) { return }
          const raw_target = parts[0]
          const prop = parts[1]
          if (raw_target === '' || prop === '') { return }

          const humanoid_bone = this.remap_track_name_to_vrm_humanoid(raw_target).split('.')[0]

          if (prop.includes('quaternion') && track instanceof THREE.QuaternionKeyframeTrack) {
            const times_q = Array.from((track.times as ArrayLike<number>) ?? [])
            const values_q = Array.from((track.values as ArrayLike<number>) ?? [])
            const qtrack = new THREE.QuaternionKeyframeTrack(`${humanoid_bone}.rotation`, times_q, values_q)
            const rot_map = vrma.humanoidTracks.rotation as unknown as Map<string, THREE.QuaternionKeyframeTrack>
            rot_map.set(humanoid_bone, qtrack)
          }
          if (prop.includes('position') && track instanceof THREE.VectorKeyframeTrack) {
            if (humanoid_bone === 'hips') {
              const times_v = Array.from((track.times as ArrayLike<number>) ?? [])
              const values_v = Array.from((track.values as ArrayLike<number>) ?? [])
              const vtrack = new THREE.VectorKeyframeTrack('hips.position', times_v, values_v)
              const trans_map = vrma.humanoidTracks.translation as unknown as Map<string, THREE.VectorKeyframeTrack>
              trans_map.set('hips', vtrack)
            }
          }
        })

        const vrm_core = this.vrm_context.vrm_instance
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const out_clip = createVRMAnimationClip(vrma, vrm_core)

        const temp_scene = new Scene()
        const node_name_to_index: Record<string, number> = {}
        const nodes: string[] = []
        out_clip.tracks.forEach((t: any) => {
          const node_name = String(t.name).split('.')[0]
          if (node_name_to_index[node_name] == null) {
            const node = new THREE.Object3D()
            node.name = node_name
            temp_scene.add(node)
            node_name_to_index[node_name] = nodes.length
            nodes.push(node_name)
          }
        })

        const json: any = await new Promise<any>((resolve, reject) => {
          const gltf_exporter = new GLTFExporter()
          const export_options = { binary: false, onlyVisible: false, embedImages: true, animations: [out_clip] }
          gltf_exporter.parse(temp_scene, (result: any) => {
            if (result == null || result instanceof ArrayBuffer) {
              reject(new Error('Unexpected GLB'))
            } else {
              resolve(result)
            }
          }, (error: unknown) => { reject(new Error(String(error))) }, export_options)
        })

        const human_bones: Record<string, { node: number }> = {}
        if (this.vrm_context.bone_name_map != null) {
          Object.keys(this.vrm_context.bone_name_map).forEach((node_name: string) => {
            const bone = this.vrm_context.bone_name_map?.[node_name]
            const node_idx = node_name_to_index[node_name]
            if (bone != null && typeof node_idx === 'number') {
              human_bones[String(bone)] = { node: node_idx }
            }
          })
        }

        json.extensions = json.extensions ?? {}
        json.extensions.VRMC_vrm_animation = { specVersion: '1.0', humanoid: { humanBones: human_bones } }
        json.extensionsUsed = Array.from(new Set([...(json.extensionsUsed ?? []), 'VRMC_vrm_animation']))
        json.extensionsRequired = Array.from(new Set([...(json.extensionsRequired ?? []), 'VRMC_vrm_animation']))

        const glb = this.pack_glb_from_gltf_json(json)
        const safe_name = clip.name.replace(/[^a-z0-9_-]+/gi, '_')
        this.save_array_buffer(glb, `${safe_name}.vrma`)
      } catch (err) {
        console.warn('VRMA export failed for clip:', clip.name, err)
      }
    }
  }

  private pack_glb_from_gltf_json (gltf: any): ArrayBuffer {
    const buffers = gltf.buffers as Array<{ uri?: string, byteLength?: number }>
    let bin = new Uint8Array(0)
    if (Array.isArray(buffers) && buffers.length > 0 && typeof buffers[0].uri === 'string') {
      const uri = buffers[0].uri
      const comma = uri.indexOf(',')
      const base64 = comma >= 0 ? uri.substring(comma + 1) : uri
      bin = this.base64_to_uint8array(base64)
      delete buffers[0].uri
      buffers[0].byteLength = bin.byteLength
    }

    const json_str = JSON.stringify(gltf)
    const json_bytes = new TextEncoder().encode(json_str)

    const padded_json = this.pad_to4(json_bytes)
    const padded_bin = this.pad_to4(bin)

    const total_length = 12 + 8 + padded_json.byteLength + (padded_bin.byteLength > 0 ? 8 + padded_bin.byteLength : 0)
    const glb = new ArrayBuffer(total_length)
    const dv = new DataView(glb)
    let offset = 0
    dv.setUint32(offset, 0x46546C67, true); offset += 4
    dv.setUint32(offset, 2, true); offset += 4
    dv.setUint32(offset, total_length, true); offset += 4
    dv.setUint32(offset, padded_json.byteLength, true); offset += 4
    dv.setUint32(offset, 0x4E4F534A, true); offset += 4
    new Uint8Array(glb, offset, padded_json.byteLength).set(padded_json); offset += padded_json.byteLength
    if (padded_bin.byteLength > 0) {
      dv.setUint32(offset, padded_bin.byteLength, true); offset += 4
      dv.setUint32(offset, 0x004E4942, true); offset += 4
      new Uint8Array(glb, offset, padded_bin.byteLength).set(padded_bin); offset += padded_bin.byteLength
    }
    return glb
  }

  private pad_to4 (data: Uint8Array): Uint8Array {
    const pad = (4 - (data.byteLength % 4)) % 4
    if (pad === 0) return data
    const out = new Uint8Array(data.byteLength + pad)
    out.set(data)
    out.fill(0x20, data.byteLength)
    return out
  }

  private base64_to_uint8array (base64: string): Uint8Array {
    const raw = atob(base64)
    const arr = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
    return arr
  }

  private remap_track_name_to_vrm_humanoid (track_name: string): string {
    // Track names look like 'BoneName.quaternion' or 'hips.position'
    const parts = track_name.split('.')
    if (parts.length < 2) { return track_name }
    const original = parts[0]

    // Optional custom map injected from caller (future: build from VRM humanoid)
    const mapped = this.vrm_context.bone_name_map?.[original]
    if (mapped != null) {
      parts[0] = String(mapped)
      return parts.join('.')
    }

    // Heuristic: pass through common humanoid names untouched; otherwise return as-is
    // (We can enhance by using VRM humanoid to map to standardized names.)
    return track_name
  }

  public async export_glb (exported_scene: Scene, animations_to_export: AnimationClip[], file_name: string): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const gltf_exporter = new GLTFExporter()

      const export_options = {
        binary: true,
        onlyVisible: false,
        embedImages: true,
        animations: animations_to_export
      }

      gltf_exporter.parse(
        exported_scene,
        (result: ArrayBuffer | Record<string, unknown>) => {
          if (result instanceof ArrayBuffer) {
            this.save_array_buffer(result, `${file_name}.glb`)
            resolve()
          } else if (result != null) {
            const json_blob = new Blob([JSON.stringify(result)], { type: 'application/json' })
            this.save_file(json_blob, `${file_name}.gltf`)
            resolve()
          } else {
            console.log('ERROR: Export result is null')
            reject(new Error('Export result is null'))
          }
        },
        (error: any) => {
          console.log('An error happened during parsing', error)
          reject(error)
        },
        export_options
      )
    })
  }

  private save_file (blob: Blob, filename: string): void {
    const link = this.ui.dom_export_button_hidden_link as HTMLAnchorElement | null
    if (link != null) {
      link.href = URL.createObjectURL(blob)
      link.download = filename
      link.click()
    } else {
      console.log('ERROR: dom_export_button_hidden_link is null')
    }
  }

  private save_array_buffer (buffer: ArrayBuffer, filename: string): void {
    this.save_file(new Blob([buffer], { type: 'application/octet-stream' }), filename)
  }
}
