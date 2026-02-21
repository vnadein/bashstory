'use client'

import { useEffect, useState, useRef } from 'react'

// Generate boot messages with realistic timestamps
function generateBootMessages(): string[] {
  const messages = [
    'Linux version 6.8.0-generic (builder@bashstory) (gcc version 14.2.0)',
    'Command line: BOOT_IMAGE=/vmlinuz-6.8.0-generic root=/dev/sda1 ro quiet splash',
    'BIOS-provided physical RAM map:',
    'BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable',
    'BIOS-e820: [mem 0x000000000009fc00-0x000000000009ffff] reserved',
    'NX (Execute Disable) protection: active',
    'SMBIOS 3.0 present.',
    'DMI: BashStory Virtual Machine, BIOS 1.0 02/21/2026',
    'Hypervisor detected: KVM',
    'tsc: Fast TSC calibration using PIT',
    'last_pfn = 0x1fffff max_arch_pfn = 0x400000000',
    'Found RAM size: 8192MB',
    'CPU: Intel(R) Core(TM) i7 @ 2.80GHz',
    "x86/fpu: Supporting XSAVE feature 0x001: 'x87 floating point registers'",
    "x86/fpu: Supporting XSAVE feature 0x002: 'SSE registers'",
    "x86/fpu: Supporting XSAVE feature 0x004: 'AVX registers'",
    'x86/fpu: Enabled xstate features 0x7, context size is 832 bytes',
    'Kernel command line: BOOT_IMAGE=/vmlinuz root=/dev/sda1',
    'Dentry cache hash table entries: 1048576',
    'Inode-cache hash table entries: 524288',
    'mem auto-init: stack:off, heap alloc:off, heap free:off',
    'Memory: 8192MB available',
    'SLUB: HWalign=64, Order=0-3, MinObjects=0, CPUs=4, Nodes=1',
    'rcu: Hierarchical RCU implementation.',
    'rcu:     RCU event tracing is enabled.',
    'NR_IRQS: 4352, nr_irqs: 256, preallocated irqs: 16',
    'Console: colour VGA+ 80x25',
    'printk: console [tty0] enabled',
    'ACPI: Core revision 20240322',
    'clocksource: hpet: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 19112604467 ns',
    'APIC: Switch to symmetric I/O mode setup',
    '..TIMER: vector=0x30 apic1=0 pin1=2 apic2=-1 pin2=-1',
    'clocksource: tsc-early: mask: 0xffffffffffffffff max_cycles: 0x2878a77d6e2, max_idle_ns: 440795266666 ns',
    'Calibrating delay loop (skipped) preset value..',
    'pid_max: default: 32768 minimum: 301',
    'Mount-cache hash table entries: 16384',
    'Mountpoint-cache hash table entries: 16384',
    'Hierarchical SRCU implementation.',
    'smp: Bringing up secondary CPUs ...',
    'smp: Brought up 1 node, 4 CPUs',
    'devtmpfs: initialized',
    'clocksource: jiffies: mask: 0xffffffff max_cycles: 0xffffffff, max_idle_ns: 19112604462 ns',
    'NET: Registered protocol family 16',
    'ACPI: Added _OSI(Linux-Dell-Video)',
    'ACPI: Added _OSI(Linux-Lenovo-NV-HDMI-Audio)',
    'ACPI: 1 ACPI AML tables successfully acquired and loaded',
    'SCSI subsystem initialized',
    'libata version 3.00 loaded.',
    'ACPI: bus type USB registered',
    'usbcore: registered new interface driver usbfs',
    'usbcore: registered new interface driver hub',
    'usbcore: registered new device driver usb',
    'PCI: Using host bridge windows from ACPI',
    'PCI: Ignoring E820 reservations for host bridge windows',
    'PCI: Using configuration type 1 for base access',
    'HugeTLB registered 2.00 MiB page size, pre-allocated 0 pages',
    'ACPI: Interpreter enabled',
    'ACPI: (supports S0 S5)',
    'ACPI: Using IOAPIC for interrupt routing',
    'PCI: Using host bridge windows from ACPI',
    'ACPI: PCI Root Bridge [PCI0] (domain 0000 [bus 00-ff])',
    'pci 0000:00:01.0: PIIX3 IDE: IDE controller at PCI 0000:00:01.0',
    'pci 0000:00:01.1: IDE controller (0x8086:0x7111 rev 0x01)',
    'ACPI: PCI Interrupt Link [LNKA] (IRQs 5 *10 11)',
    'ACPI: PCI Interrupt Link [LNKB] (IRQs 5 *10 11)',
    'ACPI: PCI Interrupt Link [LNKC] (IRQs 5 10 *11)',
    'ACPI: PCI Interrupt Link [LNKD] (IRQs 5 10 *11)',
    'vgaarb: loaded',
    'SCSI Media Changer driver v0.25',
    'pps_core: LinuxPPS API ver. 1 registered',
    'PTP clock support registered',
    'NetLabel: Initializing',
    'NetLabel:  domain hash size = 128',
    'NetLabel:  protocols = UNLABELED CIPSOv4 CALIPSO',
    'NetLabel:  unlabeled traffic allowed by default',
    'clocksource: Switched to clocksource tsc-early',
    'VFS: Disk quotas dquot_6.6.0',
    'VFS: Dquot-cache hash table entries: 512 (order 0, 4096 bytes)',
    'AppArmor: AppArmor filesystem type loaded',
    'pnp: PnP ACPI init',
    'pnp: PnP ACPI: found 6 devices',
    'clocksource: acpi_pm: mask: 0xffffff max_cycles: 0xffffff, max_idle_ns: 2085701024 ns',
    'NET: Registered protocol family 2',
    'IP idents hash table entries: 131072',
    'tcp_listen_portaddr_hash hash table entries: 4096',
    'TCP established hash table entries: 65536',
    'TCP bind hash table entries: 65536',
    'TCP: Hash tables configured (established 65536 bind 65536)',
    'UDP hash table entries: 4096',
    'UDP-Lite hash table entries: 4096',
    'NET: Registered protocol family 1',
    'RPC: Registered named UNIX socket transport module.',
    'RPC: Registered udp transport module.',
    'RPC: Registered tcp transport module.',
    'RPC: Registered tcp NFSv4.1 backchannel transport module.',
    'Trying to unpack rootfs image as initramfs...',
    'Freeing initrd memory: 8192K',
    'PCI: CLS 0 bytes, default 64',
    'workingset: timestamp_bits=40 max_order=20 bucket_order=0',
    'NFS: Registering the id_resolver key type',
    'Key type id_resolver registered',
    'Key type id_legacy registered',
    '9p: Installing v9fs 9p2000 file system support',
    'Block layer SCSI generic (bsg) driver version 0.4 loaded',
    'io scheduler mq-deadline registered',
    'io scheduler kyber registered',
    'input: Power Button as /devices/LNXSYSTM:00/LNXPWRBN:00/input/input0',
    'ACPI: Power Button [PWRF]',
    'Serial: 8250/16550 driver, 4 ports, IRQ sharing enabled',
    '00:04: ttyS0 at I/O 0x3f8 (irq = 4, base_baud = 115200) is a 16550A',
    'Non-volatile memory driver v1.3',
    'Linux agpgart interface v0.103',
    'ACPI: bus type drm_connector registered',
    'loop: module loaded',
    'scsi 0:0:0:0: Direct-Access     QEMU     QEMU HARDDISK    2.5+ PQ: 0 ANSI: 5',
    'sd 0:0:0:0: [sda] 104857600 512-byte logical blocks: (53.7 GB/50.0 GiB)',
    'sd 0:0:0:0: [sda] Write Protect is off',
    'sd 0:0:0:0: [sda] Write cache: enabled, read cache: enabled',
    ' sda: sda1 sda2',
    'sd 0:0:0:0: [sda] Attached SCSI disk',
    'Freeing unused kernel image (text/rodata gap) memory: 2048K',
    'Write protecting the kernel read-only data: 26624k',
    'Freeing unused kernel image (text/rodata gap) memory: 2040K',
    'Freeing unused kernel image (rodata/data gap) memory: 1588K',
    'x86/mm: Checked W+X mappings: passed, no W+X pages found.',
    'Run /init as init process',
    'BashStory System v1.0 initializing...',
    'Loading kernel modules...',
    'Starting system services...',
    'Mounting filesystems...',
    'Starting network...',
    'Starting database services...',
    'Starting BashStory terminal...',
    'Welcome to BashStory v1.0',
  ]

  // Generate timestamps that increase realistically
  let currentTime = 0
  return messages.map(msg => {
    // Random increment between 0.001 and 0.5 seconds
    currentTime += Math.random() * 0.5 + 0.001
    const timestamp = currentTime.toFixed(6)
    return `[    ${timestamp}] ${msg}`
  })
}

const BOOT_MESSAGES = generateBootMessages()

interface BootScreenProps {
  onComplete: () => void
}

export function BootScreen({ onComplete }: BootScreenProps) {
  const [visibleMessages, setVisibleMessages] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [systemFontsLoaded, setSystemFontsLoaded] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [visibleMessages])

  // Simulate font switch at ~60% of boot process
  useEffect(() => {
    const switchPoint = Math.floor(BOOT_MESSAGES.length * 0.6)
    if (currentIndex >= switchPoint && !systemFontsLoaded) {
      setSystemFontsLoaded(true)
    }
  }, [currentIndex, systemFontsLoaded])

  useEffect(() => {
    if (currentIndex >= BOOT_MESSAGES.length) {
      // Show complete message briefly before finishing
      // Add delay after "Welcome to BashStory" message
      setTimeout(() => {
        setIsComplete(true)
        setTimeout(onComplete, 500)
      }, 1500)
      return
    }

    // Add font switch messages at ~60% with delay
    const switchPoint = Math.floor(BOOT_MESSAGES.length * 0.6)
    if (currentIndex === switchPoint && !systemFontsLoaded) {
      // Pause and show font switch messages
      const fontMessages = [
        '[    OK    ] Started Display Manager',
        '[    OK    ] Loaded System Fonts',
      ]
      
      let delay = 0
      fontMessages.forEach((msg, i) => {
        setTimeout(() => {
          setVisibleMessages(prev => [...prev, msg])
        }, delay)
        delay += 200 // 200ms between each font message
      })
      
      // Continue with main messages after font switch
      setTimeout(() => {
        setVisibleMessages(prev => [...prev, BOOT_MESSAGES[currentIndex]])
        setCurrentIndex(prev => prev + 1)
      }, delay + 300)
      return
    }

    const delay = Math.random() * 50 + 10 // 10-60ms per line
    const timer = setTimeout(() => {
      setVisibleMessages(prev => [...prev, BOOT_MESSAGES[currentIndex]])
      setCurrentIndex(prev => prev + 1)
    }, delay)

    return () => clearTimeout(timer)
  }, [currentIndex, onComplete, systemFontsLoaded])

  return (
    <div className={`boot-screen ${systemFontsLoaded ? 'fonts-loaded' : ''}`}>
      <div className="boot-output" ref={scrollRef}>
        {visibleMessages.map((msg, i) => (
          <div key={i} className="boot-line">
            <pre>{msg}</pre>
          </div>
        ))}
        {isComplete && (
          <div className="boot-complete">
            <pre>[    0.000000] BashStory ready. Starting terminal...</pre>
          </div>
        )}
      </div>
    </div>
  )
}
